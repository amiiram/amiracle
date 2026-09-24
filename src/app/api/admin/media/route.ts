import { getCurrentAdminSession } from "@/lib/auth";
import { collectPublicMedia } from "@/lib/media/public-media";
import fs from "node:fs/promises";
import path from "node:path";

interface EnhancedMediaItem {
  url: string;
  filename: string;
  type: "image" | "video";
  project: string;
  name: string;
  size: number;
  lastModified: string;
  relativePath: string;
}

/**
 * `GET /api/admin/media` — the media index behind the Markdown editor's
 * "Insert Media" picker and the project media editor's "Browse existing media".
 *
 * The endpoint is a thin, authenticated wrapper around the server-side scan in
 * `src/lib/media/public-media.ts`: the browser never sees a filesystem path,
 * only the safe `/media/...` URLs of supported image/video files that are
 * already committed under `public/media/`. Admin-only because it is part of the
 * admin editing experience, even though the files themselves are public.
 *
 * This endpoint returns enhanced metadata (file size, last modified date, etc.)
 * to support both the Markdown editor picker and the project media editor picker.
 */
export async function GET() {
  const session = await getCurrentAdminSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseFiles = await collectPublicMedia();
  
  // Enhance with file metadata for the project media picker
  const enhancedFiles: EnhancedMediaItem[] = await Promise.all(
    baseFiles.map(async (item) => {
      // Construct the full filesystem path from the URL
      // item.url is like "/media/projects/video-platform/demo.mp4"
      // We need to construct: <cwd>/public/media/projects/video-platform/demo.mp4
      // Remove "/media/" prefix (7 chars) to get: "projects/video-platform/demo.mp4"
      const relativeToPublicMedia = item.url.substring(7);
      const fullPath = path.join(process.cwd(), "public", "media", relativeToPublicMedia);
      
      // Get file stats
      let stats: { size: number; mtime: Date } | null = null;
      try {
        stats = await fs.stat(fullPath);
      } catch (err) {
        console.error(`Failed to stat file ${fullPath}: ${err instanceof Error ? err.message : String(err)}`);
        // File may not exist on disk (e.g., during build)
      }
      
      return {
        url: item.url,
        filename: item.filename,
        type: item.type,
        project: item.project,
        name: item.filename,
        size: stats?.size ?? 0,
        lastModified: stats?.mtime.toISOString() ?? new Date().toISOString(),
        relativePath: `${item.project}/${item.filename}`,
      };
    })
  );

  return Response.json(
    { files: enhancedFiles },
    // The scan has its own short-lived cache; browsers should always re-read.
    { headers: { "Cache-Control": "no-store" } },
  );
}
