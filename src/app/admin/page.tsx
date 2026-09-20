export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
          Admin boundary
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          CMS foundation
        </h1>
        <p className="mt-2 max-w-lg text-slate-300">
          Auth, permissions, and CMS screens are intentionally deferred until
          the core data model and routes are in place.
        </p>
      </div>
    </main>
  );
}
