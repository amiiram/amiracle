import Link from "next/link";

import {
  deleteProjectAction,
  toggleProjectPublishAction,
} from "@/app/admin/projects/actions";
import { DeleteProjectButton } from "@/components/admin/delete-project-button";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export default async function AdminProjectsPage() {
  await requireAdminSession();

  const projects = await prisma.project.findMany({
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    include: {
      Technology: {
        orderBy: { name: "asc" },
      },
    },
  });

  return (
    <main className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Projects
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Project management
          </h2>
        </div>

        <Link
          href="/admin/projects/new"
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
        >
          New project
        </Link>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold text-white">
                    {project.title}
                  </h3>
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                    {project.status}
                  </span>
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                    {project.visibility}
                  </span>
                  {project.featured ? (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-amber-200">
                      Featured
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Slug
                    </p>
                    <p className="mt-1 text-slate-100">{project.slug}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Updated
                    </p>
                    <p className="mt-1 text-slate-100">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Technologies
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {project.Technology.length > 0 ? (
                      project.Technology.map((technology) => (
                        <span
                          key={technology.id}
                          className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                        >
                          {technology.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">
                        No technologies linked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <Link
                  href={`/admin/projects/${project.id}/edit`}
                  className="rounded-full border border-slate-700 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
                >
                  Edit
                </Link>

                <form action={toggleProjectPublishAction}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <button
                    type="submit"
                    className="w-full rounded-full border border-slate-700 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
                  >
                    {project.status === "published" ? "Set draft" : "Publish"}
                  </button>
                </form>

                <DeleteProjectButton
                  projectId={project.id}
                  action={deleteProjectAction}
                />
              </div>
            </div>
          </article>
        ))}

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center text-slate-400">
            No projects yet. Create the first one to populate the public
            portfolio.
          </div>
        ) : null}
      </div>
    </main>
  );
}
