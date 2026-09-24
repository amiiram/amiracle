import fs from "node:fs/promises";
import path from "node:path";

/**
 * Server-side index of the media files that are committed to the repository
 * under `public/media/`.
 *
 * The admin Markdown editor can only reference files that are already part of
 * the repository: there is no upload API, no S3/Blob/Cloudinary integration and
 * no binary column in PostgreSQL. The browser cannot read the server
 * filesystem, so the directory scan lives here and only ever hands back safe,
 * application-relative `/media/...` URLs.
 *
 * Security rules enforced below:
 * - the scan is rooted at `public/media/`; nothing else is ever read
 * - only the supported image/video extensions are reported, so `.env`, source
 *   files, `README.md`, and every other repository file are invisible
 * - `..` segments, absolute paths, and dotfiles are rejected, and every
 *   resolved path must still live inside the media root, so a symlink can not
 *   be used to escape it
 * - the returned `url` is always `/media/...`, never a filesystem path
 *
 * Performance: the result is cached in-process for a short TTL, and callers
 * (the media picker) only ask for it when the picker is opened, so no scan
 * happens while typing.
 */

export type PublicMediaType = "image" | "video";

/** What the client is allowed to know about a repository media file. */
export type PublicMediaItem = {
  /** Application-relative public URL, always beginning with `/media/`. */
  url: string;
  filename: string;
  type: PublicMediaType;
  /**
   * Owning project/folder. For `media/projects/<slug>/file` this is the project
   * slug; otherwise it is the first folder below `public/media/`.
   */
  project: string;
};

/** Filesystem root of the scan: `<repo>/public/media`. */
export const PUBLIC_MEDIA_ROOT = path.join(process.cwd(), "public", "media");

/** Prefix every returned URL must carry. */
export const PUBLIC_MEDIA_URL_PREFIX = "/media/";

/**
 * Images (`.jpg .jpeg .png .webp .gif .svg`) and videos
 * (`.mp4 .webm .mov`). Everything else in `public/media/` is ignored, which is
 * what keeps notes, sources, and dotfiles out of the index.
 */
const SUPPORTED_MEDIA_EXTENSION = /\.(?:jpe?g|png|webp|gif|svg|mp4|webm|mov)$/i;
/** Playable video files, which the Markdown renderer shows as `<video>`. */
const VIDEO_EXTENSION = /\.(?:mp4|webm|mov)$/i;

/** How long a scan result is reused before the directory is read again. */
const CACHE_TTL_MS = 30_000;

let cachedMedia: PublicMediaItem[] | null = null;
let cachedAt = 0;

/**
 * Converts a path relative to `public/media/` into the shape the picker
 * consumes. Returns `null` for anything that is not a supported, safe,
 * publicly addressable media file.
 */
export function toPublicMediaItem(relativePath: string): PublicMediaItem | null {
  const normalized = relativePath.replace(/\\/g, "/");

  if (
    !normalized ||
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    path.isAbsolute(relativePath) ||
    !SUPPORTED_MEDIA_EXTENSION.test(normalized)
  ) {
    return null;
  }

  const segments = normalized.split("/").filter(Boolean);
  const filename = segments[segments.length - 1];

  // Dotfiles (`.env`, `.gitignore`, ...) and empty segments are never exposed.
  if (!filename || filename.startsWith(".") || segments.some((segment) => segment.startsWith("."))) {
    return null;
  }

  const url = `${PUBLIC_MEDIA_URL_PREFIX}${segments.join("/")}`;

  if (!url.startsWith(PUBLIC_MEDIA_URL_PREFIX) || url.includes("//")) {
    return null;
  }

  // `projects/<slug>/file` belongs to the slug; anything else to its top folder.
  const project =
    segments[0] === "projects" && segments.length > 2 ? segments[1] : segments[0];

  return {
    url,
    filename,
    type: VIDEO_EXTENSION.test(filename) ? "video" : "image",
    project,
  };
}

/** Reads `public/media/` recursively and returns the safe media files in it. */
async function scanPublicMedia(): Promise<PublicMediaItem[]> {
  const files: PublicMediaItem[] = [];

  async function walk(directory: string) {
    let entries: import("node:fs").Dirent[];

    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      // A missing `public/media` directory simply means "no media yet".
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (!entry.isFile() || !SUPPORTED_MEDIA_EXTENSION.test(entry.name)) {
        continue;
      }

      const resolved = path.resolve(entryPath);

      // The resolved path must still be inside the media root.
      if (!resolved.startsWith(`${path.resolve(PUBLIC_MEDIA_ROOT)}${path.sep}`)) {
        continue;
      }

      const stats = await fs.stat(resolved).catch(() => null);

      if (!stats || !stats.isFile()) {
        continue;
      }

      const item = toPublicMediaItem(
        path.relative(PUBLIC_MEDIA_ROOT, resolved).split(path.sep).join("/"),
      );

      if (item) {
        files.push(item);
      }
    }
  }

  await walk(PUBLIC_MEDIA_ROOT);

  files.sort(
    (left, right) =>
      left.project.localeCompare(right.project) ||
      left.filename.localeCompare(right.filename),
  );

  return files;
}

/**
 * Returns the media files available under `public/media/`, reusing a recent
 * scan for {@link CACHE_TTL_MS} so opening the picker twice in a row does not
 * walk the directory again.
 */
export async function collectPublicMedia(): Promise<PublicMediaItem[]> {
  if (cachedMedia && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedMedia;
  }

  const files = await scanPublicMedia();

  cachedMedia = files;
  cachedAt = Date.now();

  return files;
}
