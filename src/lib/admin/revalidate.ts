import { revalidatePath, updateTag } from "next/cache";

import { PUBLIC_PORTFOLIO_CACHE_TAG } from "@/lib/portfolio-cache";

/**
 * Invalidates the shared public-portfolio cache tag and revalidates every
 * supplied App Router path.
 *
 * This is the single place admin mutations declare their cache side effects:
 * `updateTag` refreshes all `unstable_cache` loaders in
 * `src/lib/portfolio-data.ts` at once, while `revalidatePath` refreshes the
 * listed routes. Callers pass only route paths — the tag is always included
 * so no mutation can forget it.
 */
export function revalidatePortfolio(paths: ReadonlyArray<string>): void {
  updateTag(PUBLIC_PORTFOLIO_CACHE_TAG);

  for (const path of paths) {
    revalidatePath(path);
  }
}
