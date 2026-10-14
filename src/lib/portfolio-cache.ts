export const PUBLIC_PORTFOLIO_CACHE_TAG = "public-portfolio-data";

export const SITE_LOCALE = "en_US";

export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
} as const;

export function absoluteUrl(path: string, siteUrl?: string): string | undefined {
  if (!siteUrl) return undefined;
  return new URL(path, siteUrl).toString();
}

export function toIsoDate(date: Date): string {
  return date.toISOString();
}

type JsonLdValue = string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue };

export function jsonLdScript(data: Record<string, JsonLdValue>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

