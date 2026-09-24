"use client";

/**
 * Client-only editing surface behind `MarkdownEditor`.
 *
 * MDXEditor (Lexical based) does not support server rendering and its plugins
 * touch the DOM as soon as they are initialised, so this module is only ever
 * reached through `next/dynamic` with `ssr: false` from
 * `src/components/admin/markdown-editor.tsx`. Keeping the plugin setup in a
 * separate module means MDXEditor never runs during SSR.
 *
 * The editor stays a *Markdown* editor: the value it reads (and writes back
 * through `onChange`) is a plain Markdown string, which is what the database
 * stores and what `src/lib/markdown.tsx` renders on the public site. Raw HTML
 * authoring is disabled — HTML handling is suppressed and the JSX/HTML plugins
 * are not enabled, so a stray `<div>` in existing copy stays inert text.
 */

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  InsertCodeBlock,
  InsertImage,
  ListsToggle,
  MDXEditor,
  Separator,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  toolbarPlugin,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

import { useEffect, useRef } from "react";

/** Languages offered by fenced code blocks; the stored fence keeps the key. */
const codeBlockLanguages: Record<string, string> = {
  "": "Plain text",
  bash: "Shell",
  css: "CSS",
  js: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  md: "Markdown",
  sql: "SQL",
  ts: "TypeScript",
  tsx: "TSX",
  yaml: "YAML",
};

export type MarkdownEditorSurfaceProps = {
  /** Initial Markdown. Read once on mount, like a textarea `defaultValue`. */
  markdown: string;
  /**
   * Fires with the current Markdown. `initialMarkdownNormalize` is true when
   * the event is only the editor reporting its normalised version of the
   * initial document; the caller ignores those so untouched copy is stored
   * byte-for-byte as it was loaded.
   */
  onChange: (markdown: string, initialMarkdownNormalize: boolean) => void;
  placeholder?: string;
  /** Markdown the parent asks the surface to insert at the caret. */
  insertRequest?: { markdown: string; token: number } | null;
};

export function MarkdownEditorSurface({
  markdown,
  onChange,
  placeholder,
  insertRequest,
}: MarkdownEditorSurfaceProps) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!insertRequest) {
      return;
    }

    // `insertMarkdown` writes at the current caret, so focus first: by the time
    // the media picker closes, focus is on the picker's button, not the editor.
    editorRef.current?.focus();
    editorRef.current?.insertMarkdown(insertRequest.markdown);
  }, [insertRequest]);

  // Handle paste events to detect and convert markdown text
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text/plain");
      if (!text) return;

      // Check if the pasted text looks like markdown
      // (contains markdown syntax like #, *, `, -, >, [, ], etc.)
      const looksLikeMarkdown =
        /[#\`*\->\[\]()]/.test(text) &&
        !/<[a-z][\s>]/i.test(text); // Not HTML

      if (looksLikeMarkdown) {
        // Prevent default paste
        event.preventDefault();

        // Try to parse and insert as markdown
        try {
          // Use insertMarkdown to properly convert and insert
          await editorRef.current?.insertMarkdown(text);
        } catch (error) {
          console.error("Failed to insert markdown:", error);
          // Don't fall back to plain text - just let it be
        }
      }
    };

    container.addEventListener("paste", handlePaste);

    return () => {
      container.removeEventListener("paste", handlePaste);
    };
  }, []);

  return (
    <div ref={containerRef}>
      <MDXEditor
        ref={editorRef}
        markdown={markdown}
        onChange={onChange}
        placeholder={placeholder ?? "Write the story of this project..."}
        className="amiracle-markdown-editor"
        contentEditableClassName="amiracle-markdown-surface"
        // Existing HTML in stored Markdown is never turned into editable nodes.
        suppressHtmlProcessing
        // Stable, CommonMark-flavoured output (bullets `-`, emphasis `*`, fenced
        // code with backticks) so the public renderer sees exactly what it knows.
        toMarkdownOptions={{
          bullet: "-",
          emphasis: "*",
          strong: "*",
          fence: "`",
        }}
        plugins={[
          // Markdown shortcuts (`# `, `**bold**`, `- `, `> `, fences) that match
          // the syntax the public renderer understands.
          markdownShortcutPlugin(),
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          // Required for both rendering and editing existing `![alt](url)`
          // images — including the controlled video syntax documented in
          // `src/lib/markdown.tsx` (`![Demo](/media/projects/<slug>/demo.mp4)`).
          imagePlugin({
            disableImageResize: true,
            allowSetImageDimensions: false,
          }),
          codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
          codeMirrorPlugin({ codeBlockLanguages }),
          toolbarPlugin({
            toolbarClassName: "amiracle-markdown-toolbar",
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                {/* No underline: it has no Markdown equivalent in the public renderer. */}
                <BoldItalicUnderlineToggles options={["Bold", "Italic"]} />
                <CodeToggle />
                <Separator />
                <ListsToggle options={["bullet", "number"]} />
                <Separator />
                <CreateLink />
                <InsertImage />
                <InsertCodeBlock />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}
