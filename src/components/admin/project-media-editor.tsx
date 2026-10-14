"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import type { ProjectMediaFormValues } from "@/app/admin/projects/actions";
import { FieldErrors } from "@/components/admin/form-primitives";
import {
  mediaTypeOptions,
  toMediaType,
  type MediaTypeOption,
} from "@/components/admin/project-media-options";
import {
  INVALID_MEDIA_URL_MESSAGE,
  isValidMediaUrl,
} from "@/lib/media/media-url";

type ProjectMediaEditorProps = {
  media: ProjectMediaFormValues[];
  onChange: (media: ProjectMediaFormValues[]) => void;
  fieldErrors?: Record<string, string[]>;
  slugHint?: string;
};

const inputBaseClassName =
  "w-full rounded-xl border bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none";
const inputClassName = `${inputBaseClassName} border-slate-700 focus:border-slate-400`;
const invalidInputClassName = `${inputBaseClassName} border-red-500/70 focus:border-red-400`;

const buttonBaseClassName =
  "rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
const buttonClassName = `${buttonBaseClassName} border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white`;
const dangerButtonClassName = `${buttonBaseClassName} border-red-500/40 text-red-200 hover:border-red-400 hover:text-red-100`;

export function ProjectMediaEditor({
  media,
  onChange,
  fieldErrors = {},
  slugHint,
}: ProjectMediaEditorProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<MediaTypeOption>("image");
  const [newAlt, setNewAlt] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [addError, setAddError] = useState<string[] | null>(null);
  const [brokenPreviews, setBrokenPreviews] = useState<Set<string>>(new Set());

  const rowError = (index: number, field: string) =>
    fieldErrors[`media.${index}.${field}`];
  const hasRowError = (index: number, field: string) =>
    (rowError(index, field) ?? []).length > 0;
  const errorId = (index: number, field: string) =>
    `media-${index}-${field}-error`;
  const describedBy = (index: number, field: string) =>
    hasRowError(index, field) ? errorId(index, field) : undefined;

  function updateRow(index: number, patch: Partial<ProjectMediaFormValues>) {
    onChange(
      media.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function moveRow(index: number, targetIndex: number) {
    if (targetIndex < 0 || targetIndex >= media.length) {
      return;
    }

    const next = [...media];
    const [row] = next.splice(index, 1);

    next.splice(targetIndex, 0, row);
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(media.filter((_, rowIndex) => rowIndex !== index));
  }

  function addRow() {
    const url = newUrl.trim();

    if (!isValidMediaUrl(url)) {
      setAddError([INVALID_MEDIA_URL_MESSAGE]);
      return;
    }

    setAddError(null);
    onChange([
      ...media,
      { url, type: newType, alt: newAlt.trim(), caption: newCaption.trim() },
    ]);
    setNewUrl("");
    setNewType("image");
    setNewAlt("");
    setNewCaption("");
  }

  function markBrokenPreview(url: string) {
    setBrokenPreviews((previous) => new Set(previous).add(url));
  }

  const slugSegment = slugHint?.trim() || "project-slug";

  return (
    <section
      aria-labelledby="project-media-heading"
      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
    >
      <div className="mb-4">
        <h3
          id="project-media-heading"
          className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300"
        >
          Project media
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          Files must exist in the repository under{" "}
          <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs text-slate-300">
            public/media/projects/
          </code>
          . Store each file&apos;s public path, for example{" "}
          <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs text-slate-300">
            /media/projects/{slugSegment}/banner.webp
          </code>
          , or an external https:// URL. The first item is the project
          banner/cover; media changes are saved together with the project.
        </p>
      </div>

      {media.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700 px-3 py-4 text-sm text-slate-500">
          No media yet. Add a banner image below — it becomes order 0
          automatically.
        </p>
      ) : (
        <ul className="space-y-3">
          {media.map((row, index) => {
            const type = toMediaType(row.type);

            return (
              <li
                key={row.id ?? `new-${index}-${row.url}`}
                className="rounded-xl border border-slate-800 bg-slate-900 p-3"
              >
                <MediaRow
                  row={row}
                  index={index}
                  type={type}
                  slugSegment={slugSegment}
                  isBanner={index === 0}
                  isFirst={index === 0}
                  isLast={index === media.length - 1}
                  rowError={rowError}
                  hasRowError={hasRowError}
                  errorId={errorId}
                  describedBy={describedBy}
                  onChange={(patch) => updateRow(index, patch)}
                  onMoveUp={() => moveRow(index, index - 1)}
                  onMoveDown={() => moveRow(index, index + 1)}
                  onSetAsBanner={() => moveRow(index, 0)}
                  onRemove={() => removeRow(index)}
                  brokenPreview={brokenPreviews.has(row.url)}
                  onBrokenPreview={() => markBrokenPreview(row.url)}
                />
              </li>
            );
          })}
        </ul>
      )}

      <MediaAddForm
        newUrl={newUrl}
        newType={newType}
        newAlt={newAlt}
        newCaption={newCaption}
        addError={addError}
        slugSegment={slugSegment}
        onUrlChange={(value) => {
          setNewUrl(value);
          setAddError(null);
        }}
        onTypeChange={(value) => setNewType(toMediaType(value))}
        onAltChange={setNewAlt}
        onCaptionChange={setNewCaption}
        onAdd={addRow}
      />
    </section>
  );
}

type MediaRowProps = {
  row: ProjectMediaFormValues;
  index: number;
  type: MediaTypeOption;
  slugSegment: string;
  isBanner: boolean;
  isFirst: boolean;
  isLast: boolean;
  rowError: (index: number, field: string) => string[] | undefined;
  hasRowError: (index: number, field: string) => boolean;
  errorId: (index: number, field: string) => string;
  describedBy: (index: number, field: string) => string | undefined;
  onChange: (patch: Partial<ProjectMediaFormValues>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetAsBanner: () => void;
  onRemove: () => void;
  brokenPreview: boolean;
  onBrokenPreview: () => void;
};

function MediaRow({
  row,
  index,
  type,
  slugSegment,
  isBanner,
  isFirst,
  isLast,
  rowError,
  hasRowError,
  errorId,
  describedBy,
  onChange,
  onMoveUp,
  onMoveDown,
  onSetAsBanner,
  onRemove,
  brokenPreview,
  onBrokenPreview,
}: MediaRowProps) {
  return (
    <div>
      <div className="flex flex-wrap items-start gap-3">
        <MediaPreview
          url={row.url}
          type={type}
          alt={row.alt}
          broken={brokenPreview}
          onBroken={onBrokenPreview}
        />

        <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-1">
            <label
              htmlFor={`media-${index}-url`}
              className="block text-xs font-medium text-slate-400"
            >
              Media URL
            </label>
            <input
              id={`media-${index}-url`}
              value={row.url}
              onChange={(event) => onChange({ url: event.target.value })}
              aria-invalid={hasRowError(index, "url") || undefined}
              aria-describedby={describedBy(index, "url")}
              className={
                hasRowError(index, "url") ? invalidInputClassName : inputClassName
              }
              placeholder={`/media/projects/${slugSegment}/banner.webp`}
            />
            <FieldErrors
              id={errorId(index, "url")}
              messages={rowError(index, "url")}
            />
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label
              htmlFor={`media-${index}-type`}
              className="block text-xs font-medium text-slate-400"
            >
              Type
            </label>
            <select
              id={`media-${index}-type`}
              value={type}
              onChange={(event) => onChange({ type: event.target.value })}
              className={inputClassName}
            >
              {mediaTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label
              htmlFor={`media-${index}-alt`}
              className="block text-xs font-medium text-slate-400"
            >
              Alt text
            </label>
            <input
              id={`media-${index}-alt`}
              value={row.alt}
              onChange={(event) => onChange({ alt: event.target.value })}
              className={inputClassName}
              placeholder="Dashboard overview"
            />
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label
              htmlFor={`media-${index}-caption`}
              className="block text-xs font-medium text-slate-400"
            >
              Caption
            </label>
            <input
              id={`media-${index}-caption`}
              value={row.caption}
              onChange={(event) => onChange({ caption: event.target.value })}
              className={inputClassName}
              placeholder="Shown under the media on the project page"
            />
            <FieldErrors
              id={errorId(index, "caption")}
              messages={rowError(index, "caption")}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isBanner ? "bg-white text-slate-950" : "bg-slate-800 text-slate-300"
          }`}
        >
          {isBanner ? "Banner · order 0" : `Order ${index}`}
        </span>

        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className={buttonClassName}
        >
          Move up
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className={buttonClassName}
        >
          Move down
        </button>
        <button
          type="button"
          onClick={onSetAsBanner}
          disabled={isBanner}
          className={buttonClassName}
        >
          {isBanner ? "Banner" : "Set as banner"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className={dangerButtonClassName}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

type MediaAddFormProps = {
  newUrl: string;
  newType: MediaTypeOption;
  newAlt: string;
  newCaption: string;
  addError: string[] | null;
  slugSegment: string;
  onUrlChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onAltChange: (value: string) => void;
  onCaptionChange: (value: string) => void;
  onAdd: () => void;
};

type AvailableMediaFile = {
  url: string;
  relativePath: string;
  name: string;
  size: number;
  lastModified: string;
};

type MediaPickerProps = {
  /** Current URL in the add form; used to highlight the active selection. */
  selectedUrl: string;
  onSelect: (file: AvailableMediaFile) => void;
};

const videoFileExtension = /\.(?:mp4|webm|mov)$/i;

function mediaTypeForFile(url: string): MediaTypeOption {
  return videoFileExtension.test(url) ? "video" : "image";
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Lets the admin pick from media files that already exist in the repository
 * instead of typing a URL by hand. The list is loaded from the protected
 * /api/admin/media route on first open and cached afterwards.
 */
function MediaPicker({ selectedUrl, onSelect }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<AvailableMediaFile[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || files || loadError) {
      return;
    }

    let cancelled = false;

    async function loadFiles() {
      try {
        const response = await fetch("/api/admin/media");

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as {
          files?: AvailableMediaFile[];
        };

        if (!cancelled) {
          setFiles(payload.files ?? []);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Could not load the media list. Please try again.");
        }
      }
    }

    loadFiles();

    return () => {
      cancelled = true;
    };
  }, [open, files, loadError]);

  return (
    <div className="md:col-span-2">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className={buttonClassName}
      >
        {open ? "Hide existing media" : "Browse existing media"}
      </button>

      {open ? (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
          {loadError ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-red-300">{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoadError(null);
                  setFiles(null);
                }}
                className={buttonClassName}
              >
                Retry
              </button>
            </div>
          ) : files === null ? (
            <p className="text-sm text-slate-500">Loading media…</p>
          ) : files.length === 0 ? (
            <p className="text-sm text-slate-500">
              No media files found under{" "}
              <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs text-slate-300">
                public/media/projects/
              </code>
              . Add files to the repository first.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => {
                const isSelected = file.url === selectedUrl;

                return (
                  <li key={file.url}>
                    <button
                      type="button"
                      onClick={() => onSelect(file)}
                      aria-pressed={isSelected}
                      className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                        isSelected
                          ? "border-slate-300 bg-slate-900"
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                      }`}
                    >
                      <span className="relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-800 bg-slate-950">
                        {mediaTypeForFile(file.url) === "image" ? (
                          <Image
                            src={file.url}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-[10px] uppercase tracking-wide text-slate-500">
                            video
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-slate-200">
                          {file.name}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {file.relativePath}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {formatFileSize(file.size)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MediaAddForm({
  newUrl,
  newType,
  newAlt,
  newCaption,
  addError,
  slugSegment,
  onUrlChange,
  onTypeChange,
  onAltChange,
  onCaptionChange,
  onAdd,
}: MediaAddFormProps) {
  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
        Add media
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <MediaPicker
          selectedUrl={newUrl}
          onSelect={(file) => {
            onUrlChange(file.url);
            onTypeChange(mediaTypeForFile(file.url));
          }}
        />

        <div className="space-y-1.5 md:col-span-2">
          <label
            htmlFor="new-media-url"
            className="block text-xs font-medium text-slate-400"
          >
            Media URL{" "}
            <span className="font-normal text-slate-500">
              (filled automatically when you pick a file above; you can still
              paste an external https:// URL)
            </span>
          </label>
          <input
            id="new-media-url"
            value={newUrl}
            onChange={(event) => onUrlChange(event.target.value)}
            className={addError ? invalidInputClassName : inputClassName}
            aria-invalid={addError ? true : undefined}
            aria-describedby={addError ? "new-media-url-error" : undefined}
            placeholder={`/media/projects/${slugSegment}/banner.webp`}
          />
          <FieldErrors id="new-media-url-error" messages={addError ?? undefined} />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="new-media-type"
            className="block text-xs font-medium text-slate-400"
          >
            Type
          </label>
          <select
            id="new-media-type"
            value={newType}
            onChange={(event) => onTypeChange(event.target.value)}
            className={inputClassName}
          >
            {mediaTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="new-media-alt"
            className="block text-xs font-medium text-slate-400"
          >
            Alt text
          </label>
          <input
            id="new-media-alt"
            value={newAlt}
            onChange={(event) => onAltChange(event.target.value)}
            className={inputClassName}
            placeholder="Dashboard overview"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label
            htmlFor="new-media-caption"
            className="block text-xs font-medium text-slate-400"
          >
            Caption
          </label>
          <input
            id="new-media-caption"
            value={newCaption}
            onChange={(event) => onCaptionChange(event.target.value)}
            className={inputClassName}
            placeholder="Shown under the media on the project page"
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-400 hover:bg-slate-800"
        >
          Add media
        </button>
      </div>
    </div>
  );
}

const previewFrameClassName =
  "relative flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-950";

/**
 * Lightweight previews only: real previews for images, a native muted video
 * element for videos, and an icon tile for embeds. Nothing auto-plays and no
 * third-party frame is ever injected into the admin.
 */
function MediaPreview({
  url,
  type,
  alt,
  broken,
  onBroken,
}: {
  url: string;
  type: MediaTypeOption;
  alt: string;
  broken: boolean;
  onBroken: () => void;
}) {
  if (type === "image" && url && !broken) {
    return (
      <div className={previewFrameClassName}>
        <Image
          src={url}
          alt={alt || "Media preview"}
          fill
          sizes="160px"
          onError={onBroken}
          className="object-cover"
        />
      </div>
    );
  }

  if (type === "video" && url && !broken) {
    return (
      <div className={previewFrameClassName}>
        <video
          src={url}
          muted
          preload="metadata"
          onError={onBroken}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const label =
    type === "embed"
      ? "Embed preview"
      : url
        ? "Preview unavailable"
        : "No preview";

  return (
    <div className={previewFrameClassName}>
      <span className="px-2 text-center text-xs text-slate-500">{label}</span>
    </div>
  );
}



