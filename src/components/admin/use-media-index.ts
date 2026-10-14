"use client";

import { useCallback, useEffect, useState } from "react";

import { isSafeMediaItem } from "@/components/admin/media-snippets";
import type { PublicMediaItem } from "@/lib/media/public-media";

// The index is fetched once per browser session, and only when the picker is
// opened, so nothing scans the filesystem while the author types.
let cachedMediaIndex: PublicMediaItem[] | null = null;
let inflightMediaIndex: Promise<PublicMediaItem[]> | null = null;

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

export type MediaIndexState = {
  files: PublicMediaItem[] | null;
  error: string | null;
  reload: () => void;
};

/**
 * Loads the repository media index on demand with session-level caching and
 * in-flight deduplication. The caller decides when to subscribe — the
 * picker mounts this only while open.
 */
export function useMediaIndex(): MediaIndexState {
  const [files, setFiles] = useState<PublicMediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return { files, error, reload: load };
}
