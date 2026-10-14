/**
 * Shared media-URL rule for project media.
 *
 * A media URL is either an absolute `http(s)` URL or an application-relative
 * path: a single leading slash, no traversal (`.` / `..`), and a filename
 * with an extension. Local filesystem paths (`C:\…`, `file://…`),
 * protocol-relative URLs, and extensionless blobs are rejected so the stored
 * value can always be rendered by the browser as-is.
 *
 * The rule lives here — framework-free, no React, no Zod — so both the
 * server-side Zod schema (`src/lib/validations/content.ts`) and the
 * client-side pre-check (`project-media-editor.tsx`) enforce exactly the same
 * policy. The server remains the authority; the client only avoids a
 * round-trip for obvious mistakes.
 */
export function isValidMediaUrl(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  // External URLs must parse and use http(s).
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);

      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  // Application-relative paths: single leading slash, no traversal,
  // no backslashes, and a filename with an extension at the end.
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    const segments = trimmed.split("?")[0].split("#")[0].split("/");

    if (segments.some((segment) => segment === ".." || segment === ".")) {
      return false;
    }

    const filename = segments[segments.length - 1];

    return filename.length > 0 && /\.[a-z0-9]{1,10}$/i.test(filename);
  }

  return false;
}

/**
 * Canonical user-facing message for rejected media URLs, shared so the Zod
 * error and the client-side add-form error never drift apart.
 */
export const INVALID_MEDIA_URL_MESSAGE =
  "Use a public path that starts with / (for example /media/projects/video-platform/banner.webp) or an https:// URL";
