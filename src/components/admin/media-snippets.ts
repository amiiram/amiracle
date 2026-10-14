import type { PublicMediaItem } from "@/lib/media/public-media";

/** `dashboard.webp` -> `Dashboard`; used when no alt text is available. */
export function toAltTextFromFilename(filename: string) {
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
export function toMarkdownSnippet(item: PublicMediaItem, altText: string) {
  const safeAlt = altText.replace(/[[\]]+/g, "").trim() || "Media";

  return `![${safeAlt}](${item.url})`;
}

/** Client-side mirror of the server's URL rules; anything else is ignored. */
export function isSafeMediaItem(value: unknown): value is PublicMediaItem {
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
