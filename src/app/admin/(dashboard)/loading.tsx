/**
 * Loading state for the dynamic admin dashboard routes.
 *
 * Every route under `(dashboard)` is server-rendered on demand (they query
 * Prisma per request), so this skeleton shows while the session check and the
 * page's data queries run. It mirrors the dark admin chrome so there is no
 * flash of an unstyled page.
 */
export default function AdminDashboardLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-slate-950 text-slate-50"
    >
      <span className="sr-only">Loading the admin dashboard…</span>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">
          <div className="h-3 w-28 rounded bg-slate-800" />
          <div className="mt-3 h-6 w-56 rounded bg-slate-800" />
        </header>

        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-800" />
          <div className="h-24 rounded-2xl border border-slate-800 bg-slate-900/50" />
          <div className="h-24 rounded-2xl border border-slate-800 bg-slate-900/50" />
          <div className="h-24 rounded-2xl border border-slate-800 bg-slate-900/50" />
        </div>
      </div>
    </div>
  );
}