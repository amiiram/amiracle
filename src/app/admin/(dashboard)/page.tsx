import { logoutAction } from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/auth";

export default async function AdminPage() {
  const user = await requireAdminSession();

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Authenticated admin
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Welcome back, {user.name || user.email}
            </h1>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-700"
            >
              Logout
            </button>
          </form>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Account
            </p>
            <p className="mt-2 text-lg font-medium text-white">{user.email}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Role
            </p>
            <p className="mt-2 text-lg font-medium text-white">Owner</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Session
            </p>
            <p className="mt-2 text-lg font-medium text-white">Active</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Projects
          </p>
          <p className="mt-3 text-lg font-semibold text-white">
            Portfolio content
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Technologies
          </p>
          <p className="mt-3 text-lg font-semibold text-white">
            Stack references
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Settings
          </p>
          <p className="mt-3 text-lg font-semibold text-white">
            Site configuration
          </p>
        </div>
      </section>
    </main>
  );
}
