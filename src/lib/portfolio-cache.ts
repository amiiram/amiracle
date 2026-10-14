/**
 * Cache tag shared by every public portfolio query in `src/lib/portfolio-data.ts`.
 *
 * Admin mutations invalidate this tag via `updateTag` (see `src/lib/admin/…`
 * once introduced) so `unstable_cache` entries refresh atomically. SEO helpers
 * live in `src/lib/seo.ts` — this module intentionally exports only cache
 * concerns so the two responsibilities cannot drift apart again.
 */
export const PUBLIC_PORTFOLIO_CACHE_TAG = "public-portfolio-data";

