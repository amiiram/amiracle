import Link from "next/link";

import { TerminalWindow } from "@/components/not-found-terminal";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <SiteHeader />

      <main className="flex flex-1 w-full items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex w-full max-w-180 flex-col items-center justify-center gap-6 sm:gap-8">
          <div className="flex w-full flex-col items-center justify-start gap-3 text-center sm:gap-4">
            <div className="inline-flex items-center gap-2 rounded-xs bg-[#111114] px-2.5 py-1 ring-1 ring-inset ring-[#EF4444] sm:px-3 sm:py-1.2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
              </span>
              <span className="font-mono text-[10px] font-normal uppercase tracking-wider text-[#EF4444] sm:text-[11px]">
                CRITICAL_ERROR // RESOURCE_NOT_FOUND
              </span>
            </div>

            <div
              className="w-full text-center text-[76px] font-normal leading-none tracking-tight text-[#F4F4F6] sm:text-[100px] md:text-[120px]"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              404
            </div>

            <p className="max-w-145 text-center font-sans text-sm font-normal leading-relaxed text-[#8E8E93] sm:text-base md:text-lg">
              The route is missing. Either the page never shipped or the
              compiler lost the path. Either way, the system is still running.
            </p>
          </div>

          <TerminalWindow />

          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xs bg-[#F4F4F6] px-5 py-2.5 font-mono text-xs font-semibold text-[#0A0A0C] transition hover:bg-white sm:px-6 sm:py-3 sm:text-[13px]"
            >
              Return to home
            </Link>
            <Link
              href="/#work"
              className="inline-flex items-center justify-center rounded-xs bg-transparent px-5 py-2.5 font-mono text-xs font-normal text-[#F4F4F6] ring-1 ring-inset ring-[#222226] transition hover:border-[#38383e] hover:bg-[#111114] sm:px-6 sm:py-3 sm:text-[13px]"
            >
              Browse work instead
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
