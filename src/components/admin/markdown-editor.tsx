"use client";

/**
 * The admin Markdown editor.
 *
 * It is built on MDXEditor (`@mdxeditor/editor`) and keeps Markdown as the
 * single stored value: the editor writes into a hidden input, so the
 * surrounding React 19 server-action forms receive a normal string exactly like
 * the plain textareas they used to use. No HTML is ever produced or stored.
 *
 * Three pieces make up the editor:
 *
 * 1. the editing surface (`markdown-editor-surface.tsx`), loaded client-side
 *    only because MDXEditor cannot be server rendered;
 * 2. `Insert Media`, which opens a picker over the files committed under
 *    `public/media/` (indexed by `GET /api/admin/media`);
 * 3. `Preview`, which renders the current value with the very same renderer the
 *    public site uses (`src/lib/markdown.tsx`), so there is one source of truth
 *    for how Markdown is displayed.
 *
 * Videos: Markdown has no native video syntax and raw HTML authoring is not
 * allowed, so a video is inserted with the controlled image syntax whose URL
 * ends in a video extension. `src/lib/markdown.tsx` documents and implements
 * that mapping.
 */

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FieldErrors,
  controlClassName,
  invalidControlClassName,
} from "@/components/admin/form-primitives";
import type { PublicMediaItem } from "@/lib/media/public-media";
import { renderMarkdown } from "@/lib/markdown";

/**
 * The editing surface is client-only: MDXEditor's Lexical/plugin setup touches
 * the DOM at module scope and would break during server rendering.
 */
const MarkdownEditorSurface = dynamic(
  () =>
    import("@/components/admin/markdown-editor-surface").then(
      (module) => module.MarkdownEditorSurface,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="px-1 py-6 text-sm text-slate-500">Loading editor...</p>
    ),
  },
);

/** A row of `ProjectMedia` used as extra alt-text metadata for inserted files. */
export type MarkdownMediaHint = {
  url: string;
  alt?: string | null;
};

export type MarkdownEditorProps = {
  id: string;
  /** Form field name the Markdown string is submitted under. */
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  /** Current project slug, when known: its media is listed first. */
  projectSlug?: string;
  /** Existing `ProjectMedia` rows, used only to suggest alt text. */
  projectMedia?: ReadonlyArray<MarkdownMediaHint>;
  invalid?: boolean;
  describedBy?: string;
  labelledBy?: string;
  className?: string;
};

type EditorMode = "write" | "preview";

const toolbarButtonClassName =
  "rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
const toolbarButtonIdleClassName = `${toolbarButtonClassName} border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white`;
const toolbarButtonActiveClassName = `${toolbarButtonClassName} border-slate-500 bg-slate-800 text-white`;
const insertMediaButtonClassName =
  "rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-slate-400 hover:bg-slate-700";
/** Shell used for the Write/Preview preview panel (public `.markdown-body`). */
const previewPanelClassName = "markdown-body min-h-40 px-1 py-2 text-slate-100";

/** `dashboard.webp` -> `Dashboard`; used when no alt text is available. */
function toAltTextFromFilename(filename: string) {
  const words = filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();

  if (!words) {
    return "Media";
  }

  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Markdown has no video syntax, so a video is written as an image whose URL
 * ends in a video extension; `src/lib/markdown.tsx` renders those as a
 * controlled `<video controls>`. Images and videos therefore both use the
 * ordinary, portable `![alt](url)` form.
 */
function toMarkdownSnippet(item: PublicMediaItem, altText: string) {
  const safeAlt = altText.replace(/[[\]]+/g, "").trim() || "Media";

  return `![${safeAlt}](${item.url})`;
}

/** Client-side mirror of the server's URL rules; anything else is ignored. */
function isSafeMediaItem(value: unknown): value is PublicMediaItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<PublicMediaItem>;

  return (
    typeof candidate.url === "string" &&
    typeof candidate.filename === "string" &&
    typeof candidate.project === "string" &&
    (candidate.type === "image" || candidate.type === "video") &&
    candidate.url.startsWith("/media/") &&
    !candidate.url.includes("..")
  );
}

// The index is fetched once per browser session, and only when the picker is
// opened, so nothing scans the filesystem while the author types.
let cachedMediaIndex: PublicMediaItem[] | null = null;
let inflightMediaIndex: Promise<PublicMediaItem[]> | null = null;

function resetMediaIndexCache() {
  cachedMediaIndex = null;
  inflightMediaIndex = null;
}

async function loadPublicMedia(): Promise<PublicMediaItem[]> {
  if (cachedMediaIndex) {
    return cachedMediaIndex;
  }

  if (!inflightMediaIndex) {
    inflightMediaIndex = (async () => {
      const response = await fetch("/api/admin/media", {
        headers: { accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Media index request failed (${response.status})`);
      }

      const payload: unknown = await response.json();
      const files =
        typeof payload === "object" && payload !== null && "files" in payload
          ? (payload as { files?: unknown }).files
          : null;

      if (!Array.isArray(files)) {
        return [];
      }

      return files.filter(isSafeMediaItem);
    })();
  }

  try {
    const files = await inflightMediaIndex;

    cachedMediaIndex = files;

    return files;
  } catch (error) {
    // Let the next attempt run instead of caching the failure.
    inflightMediaIndex = null;
    throw error;
  }
}

/**
 * The "Insert Media" dialog. It only ever shows files that already exist under
 * `public/media/`, puts the current project's files first, and cancels without
 * touching the Markdown.
 */
function MediaPickerDialog({
  projectSlug,
  onSelect,
  onClose,
}: {
  projectSlug?: string;
  onSelect: (item: PublicMediaItem) => void;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<PublicMediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const titleId = useId();

  const load = useCallback(() => {
    let cancelled = false;

    loadPublicMedia()
      .then((items) => {
        if (!cancelled) {
          setError(null);
          setFiles(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFiles(null);
          setError("Could not load media. Please try again.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const slug = (projectSlug ?? "").trim().toLowerCase();

  const { projectFiles, otherFiles } = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const matches = (files ?? []).filter((file) => {
      if (!needle) {
        return true;
      }

      return `${file.filename} ${file.project} ${file.url}`
        .toLowerCase()
        .includes(needle);
    });

    const belongsToProject = (file: PublicMediaItem) =>
      Boolean(slug) &&
      (file.project.toLowerCase() === slug ||
        file.url.toLowerCase().includes(`/${slug}/`));

    return {
      projectFiles: matches.filter(belongsToProject),
      otherFiles: matches.filter((file) => !belongsToProject(file)),
    };
  }, [files, query, slug]);

  const renderRow = (file: PublicMediaItem) => (
    <li key={file.url}>
      <button
        type="button"
        onClick={() => onSelect(file)}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-left transition hover:border-slate-500"
      >
        <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
          {file.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- repository media is a plain static asset, not an optimized route
            <img
              src={file.url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
              video
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium text-slate-100">
            {file.filename}
          </span>
          <span className="block truncate text-[11px] text-slate-500">
            {file.project}
          </span>
          <span className="block truncate text-[11px] text-slate-600">
            {file.url}
          </span>
        </span>
      </button>
    </li>
  );

  const sectionHeadingClassName =
    "mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-800 px-4 py-3">
          <h3 id={titleId} className="text-sm font-semibold text-white">
            Insert Media
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Files already committed under public/media/. Selecting one only adds
            a Markdown reference - no database rows are created.
          </p>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search..."
            aria-label="Search media"
            className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
          />
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-4">
          {error ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-red-300">{error}</p>
              <button
                type="button"
                className={toolbarButtonIdleClassName}
                onClick={() => {
                  resetMediaIndexCache();
                  setError(null);
                  setFiles(null);
                  load();
                }}
              >
                Retry
              </button>
            </div>
          ) : files === null ? (
            <p className="text-sm text-slate-500">Loading media...</p>
          ) : projectFiles.length === 0 && otherFiles.length === 0 ? (
            <p className="text-sm text-slate-500">
              No media found. Add files under public/media/ first.
            </p>
          ) : (
            <div className="space-y-4">
              {projectFiles.length > 0 ? (
                <section>
                  <p className={sectionHeadingClassName}>Project media</p>
                  <ul className="space-y-2">{projectFiles.map(renderRow)}</ul>
                </section>
              ) : null}

              {otherFiles.length > 0 ? (
                <section>
                  <p className={sectionHeadingClassName}>
                    {projectFiles.length > 0 ? "All public media" : "Public media"}
                  </p>
                  <ul className="space-y-2">{otherFiles.map(renderRow)}</ul>
                </section>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-4 py-3">
          <p className="text-[11px] text-slate-500">
            Videos are inserted as{" "}
            <code>{`![alt](/media/.../file.mp4)`}</code>.
          </p>
          <button
            type="button"
            className={toolbarButtonIdleClassName}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The reusable editor: editing surface, Insert Media, Write/Preview, and the
 * hidden input the surrounding form submits.
 *
 * The value is uncontrolled after mount (like a textarea `defaultValue`), so a
 * rejected server action never wipes what the author typed; the parent form
 * remounts the editor with the validated Markdown when a submission fails.
 */
export function MarkdownEditor({
  id,
  name,
  defaultValue,
  placeholder,
  projectSlug,
  projectMedia,
  invalid,
  describedBy,
  labelledBy,
  className,
}: MarkdownEditorProps) {
  const initialMarkdown = defaultValue ?? "";
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [mode, setMode] = useState<EditorMode>("write");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [insertRequest, setInsertRequest] = useState<{
    markdown: string;
    token: number;
  } | null>(null);
  const insertToken = useRef(0);

  const handleChange = useCallback(
    (next: string, initialMarkdownNormalize: boolean) => {
      // MDXEditor reports its normalised version of the loaded document as soon
      // as it mounts. Ignoring that event keeps the stored Markdown identical to
      // what was loaded until the author actually edits something.
      if (initialMarkdownNormalize) {
        return;
      }

      setMarkdown(next);
    },
    [],
  );

  const insertMedia = useCallback(
    (item: PublicMediaItem) => {
      const knownAlt = projectMedia?.find(
        (media) => media.url === item.url,
      )?.alt;
      const altText = knownAlt?.trim() || toAltTextFromFilename(item.filename);

      setPickerOpen(false);
      setMode("write");
      insertToken.current += 1;
      setInsertRequest({
        markdown: toMarkdownSnippet(item, altText),
        token: insertToken.current,
      });
    },
    [projectMedia],
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className={insertMediaButtonClassName}
          onClick={() => setPickerOpen(true)}
        >
          Insert Media
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-pressed={mode === "write"}
            className={
              mode === "write"
                ? toolbarButtonActiveClassName
                : toolbarButtonIdleClassName
            }
            onClick={() => setMode("write")}
          >
            Write
          </button>
          <button
            type="button"
            aria-pressed={mode === "preview"}
            className={
              mode === "preview"
                ? toolbarButtonActiveClassName
                : toolbarButtonIdleClassName
            }
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        data-invalid={invalid ? "true" : undefined}
        className={className ?? controlClassName}
      >
        {/* The surface stays mounted in preview mode so the author's caret and
            undo history survive a round trip through the preview. */}
        <div className={mode === "preview" ? "hidden" : undefined}>
          <MarkdownEditorSurface
            markdown={initialMarkdown}
            onChange={handleChange}
            placeholder={placeholder}
            insertRequest={insertRequest}
          />
        </div>

        {mode === "preview" ? (
          <div className={previewPanelClassName} aria-live="polite">
            {markdown.trim() ? (
              renderMarkdown(markdown)
            ) : (
              <p className="text-sm text-slate-500">Nothing to preview yet.</p>
            )}
          </div>
        ) : null}
      </div>

      {/* The Markdown string is what the server action receives. */}
      <input type="hidden" id={id} name={name} value={markdown} />

      {pickerOpen ? (
        <MediaPickerDialog
          projectSlug={projectSlug}
          onSelect={insertMedia}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}

/**
 * Label + editor + field errors, so `ProjectForm` and `SiteSettingsForm` can
 * drop it in exactly where their `description` / `aboutMarkdown` textareas used
 * to be, keeping the admin form pattern (including `aria-invalid` and the
 * per-field error list) intact.
 *
 * `fieldErrors` keys are the server-action field names. The editor is keyed by
 * the value it is handed: when a submission fails, the action returns the
 * submitted Markdown and the editor remounts with it, so nothing is lost.
 */
export function MarkdownField({
  id,
  name,
  label,
  defaultValue,
  placeholder,
  projectSlug,
  projectMedia,
  fieldErrors,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
  projectSlug?: string;
  projectMedia?: ReadonlyArray<MarkdownMediaHint>;
  fieldErrors?: Record<string, string[]>;
}) {
  const messages = fieldErrors?.[name] ?? [];
  const hasError = messages.length > 0;
  const errorId = `${id}-error`;
  const labelId = `${id}-label`;

  return (
    <div className="space-y-2">
      <span id={labelId} className="block text-sm font-medium text-slate-200">
        {label}
      </span>

      <MarkdownEditor
        key={`${id}-${defaultValue ?? ""}`}
        id={id}
        name={name}
        labelledBy={labelId}
        describedBy={hasError ? errorId : undefined}
        invalid={hasError || undefined}
        className={hasError ? invalidControlClassName : controlClassName}
        defaultValue={defaultValue}
        placeholder={placeholder}
        projectSlug={projectSlug}
        projectMedia={projectMedia}
      />

      <FieldErrors id={errorId} messages={messages} />

      <p className="text-xs text-slate-500">
        Stored as Markdown and rendered by the site&apos;s own renderer. Videos
        use image syntax with a video file:{" "}
        <code>{`![Demo](/media/projects/<slug>/demo.mp4)`}</code>
      </p>
    </div>
  );
}



