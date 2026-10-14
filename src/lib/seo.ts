import type { Metadata } from "next";

import { getPublicSiteUrl } from "@/lib/env";

/** Canonical site locale used by Open Graph metadata. */
export const SITE_LOCALE = "en_US";

/** Shared Open Graph image route (1200x630 PNG generated per route). */
export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
} as const;

export const TWITTER_IMAGE_URL = "/twitter-image";

/** Build an absolute URL against the canonical site origin. */
export function absoluteUrl(path: string, siteUrl?: string): string | undefined {
  if (!siteUrl) return undefined;
  try {
    return new URL(path, siteUrl).toString();
  } catch {
    return undefined;
  }
}

/** Get the canonical URL for a public path, or undefined when unconfigured. */
export function canonicalUrl(path: string): string | undefined {
  return absoluteUrl(path, getPublicSiteUrl());
}

/** Narrow JSON-LD value type so structured data stays serializable. */
export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonLdValue[]
  | { [key: string]: JsonLdValue | undefined };

/** Serialize JSON-LD safely for inline <script> injection. */
export function jsonLdScript(data: Record<string, JsonLdValue | undefined>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Absolute URL for an Open Graph / Twitter image path. */
export function absoluteOgImage(path: string, siteUrl?: string): string {
  return absoluteUrl(path, siteUrl) ?? path;
}

type PageSeoInput = {
  path: string;
  title: string;
  description: string;
  ogType?: "website" | "article";
};

/**
 * Shared per-page SEO builder: canonical + Open Graph + Twitter.
 * Keeps every public page consistent without repeating metadata boilerplate.
 */
export function pageMetadata({ path, title, description, ogType = "website" }: PageSeoInput): Metadata {
  const canonical = canonicalUrl(path);
  const siteUrl = getPublicSiteUrl();

  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title,
      description,
      type: ogType,
      locale: SITE_LOCALE,
      ...(canonical ? { url: canonical } : {}),
      images: [
        {
          url: absoluteOgImage(DEFAULT_OG_IMAGE.url, siteUrl),
          width: DEFAULT_OG_IMAGE.width,
          height: DEFAULT_OG_IMAGE.height,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteOgImage(TWITTER_IMAGE_URL, siteUrl)],
    },
  };
}
