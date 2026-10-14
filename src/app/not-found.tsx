import Link from "next/link";

import { TerminalWindow } from "@/components/not-found-terminal";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />

      <main className="flex flex-1 w-full items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex w-full max-w-180 flex-col items-center justify-center gap-6 sm:gap-8">
          <div className="flex w-full flex-col items-center justify-start gap-3 text-center sm:gap-4">
            <div className="inline-flex items-center gap-2 rounded-none border border-[var(--am-danger)] bg-[var(--am-surface)] px-2.5 py-1 sm:px-3 sm:py-1.2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--am-danger)]" />
              </span>
              <span className="font-mono text-[10px] font-normal uppercase tracking-wider text-[var(--am-danger)] sm:text-[11px]">
                CRITICAL_ERROR // RESOURCE_NOT_FOUND
              </span>
            </div>

            <div
              className="w-full text-center text-[76px] font-normal leading-none tracking-tight text-[var(--am-text)] sm:text-[100px] md:text-[120px]"
              style={{ fontFamily: "var(--am-font-sans)" }}
            >
              404
            </div>

            <p className="max-w-145 text-center font-sans text-sm font-normal leading-relaxed text-[var(--am-text-muted)] sm:text-base md:text-lg">
              The route is missing. Either the page never shipped or the
              compiler lost the path. Either way, the system is still running.
            </p>
          </div>

          <TerminalWindow />

          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-none bg-[var(--am-btn-bg)] px-5 py-2.5 font-mono text-xs font-semibold text-[var(--am-btn-fg)] transition hover:bg-[var(--am-btn-bg-hover)] sm:px-6 sm:py-3 sm:text-[13px]"
            >
              Return to home
            </Link>
            <Link
              href="/#work"
              className="inline-flex items-center justify-center rounded-none border border-[var(--am-control-border)] bg-transparent px-5 py-2.5 font-mono text-xs font-normal text-[var(--am-text)] transition hover:bg-[var(--am-surface-2)] sm:px-6 sm:py-3 sm:text-[13px]"
            >
              Browse work instead
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
