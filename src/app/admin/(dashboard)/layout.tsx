import type { ReactNode } from "react";
import Link from "next/link";

import { requireAdminSession } from "@/lib/auth";

/**
 * Structural authentication boundary for every dashboard route.
 *
 * Each page and server action already calls `requireAdminSession()` on its own,
 * but that relies on each new file remembering to do so. Guarding here means a
 * page added under `(dashboard)` is private by default and can only be exposed
 * deliberately. It must stay a call inside an async Server Component (not a
 * middleware matcher) so it can read the session cookie and query the user.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 shadow-lg shadow-slate-950/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Amiracle admin
              </p>
              <Link
                href="/admin"
                className="mt-1 inline-block text-xl font-semibold text-white"
              >
                Portfolio dashboard
              </Link>
            </div>

            <nav className="flex flex-wrap gap-2 text-sm text-slate-300">
              <Link
                href="/admin"
                className="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-slate-500 hover:text-white"
              >
                Overview
              </Link>
              <Link
                href="/admin/projects"
                className="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-slate-500 hover:text-white"
              >
                Projects
              </Link>
              <Link
                href="/admin/experience"
                className="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-slate-500 hover:text-white"
              >
                Experience
              </Link>
              <Link
                href="/admin/technologies"
                className="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-slate-500 hover:text-white"
              >
                Technologies
              </Link>
              <Link
                href="/admin/settings"
                className="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-slate-500 hover:text-white"
              >
                Settings
              </Link>
            </nav>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
