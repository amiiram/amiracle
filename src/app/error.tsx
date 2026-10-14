"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Public error boundary.
 *
 * Rendered in place of a route when a Server Component (or any render) throws.
 * It deliberately omits the raw error message, which can leak internals, and
 * keeps the terminal visual language of the 404 page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is a safe, server-generated identifier to log; the message may
    // contain internals and is not sent to any third party here.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 w-full items-center justify-center px-4 py-12 sm:px-6">
        <div className="flex w-full max-w-150 flex-col items-center justify-center gap-6 text-center sm:gap-8">
          <div className="flex w-full flex-col items-center justify-start gap-3 sm:gap-4">
            <div className="inline-flex items-center gap-2 border border-[var(--am-danger)] bg-[var(--am-surface)] px-2.5 py-1 sm:px-3 sm:py-1.2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--am-danger)]" />
              </span>
              <span className="font-mono text-[10px] font-normal uppercase tracking-wider text-[var(--am-danger)] sm:text-[11px]">
                CRITICAL_ERROR // RENDER_FAULT
              </span>
            </div>

            <h1
              className="text-[56px] font-normal leading-none tracking-tight text-[var(--am-text)] sm:text-[80px] md:text-[96px]"
              style={{ fontFamily: "var(--am-font-sans)" }}
            >
              500
            </h1>

            <p className="max-w-130 text-center font-sans text-sm font-normal leading-relaxed text-[var(--am-text-muted)] sm:text-base">
              Something broke while rendering this page. The rest of the system
              is still running — try again, or head back home.
            </p>

            {error.digest ? (
              <p className="font-mono text-[10px] text-[var(--am-text-muted)] sm:text-[11px]">
                ref: {error.digest}
              </p>
            ) : null}
          </div>

          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={reset}
              className="inline-flex cursor-pointer items-center justify-center border border-transparent bg-[var(--am-btn-bg)] px-5 py-2.5 font-mono text-xs font-semibold text-[var(--am-btn-fg)] transition hover:bg-[var(--am-btn-bg-hover)] sm:px-6 sm:py-3 sm:text-[13px]"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center border border-[var(--am-control-border)] bg-transparent px-5 py-2.5 font-mono text-xs font-normal text-[var(--am-text)] transition hover:bg-[var(--am-surface-2)] sm:px-6 sm:py-3 sm:text-[13px]"
            >
              Return to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}