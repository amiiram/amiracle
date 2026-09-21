import Link from "next/link";

import {
  createTechnologyAction,
  deleteTechnologyAction,
  updateTechnologyAction,
} from "@/app/admin/technologies/actions";
import { DeleteTechnologyButton } from "@/components/admin/delete-technology-button";
import { TechnologyForm } from "@/components/admin/technology-form";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const statusMessages: Record<string, string> = {
  created: "Technology created.",
  updated: "Technology updated.",
  deleted: "Technology deleted.",
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminTechnologiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string | string[];
    status?: string | string[];
  }>;
}) {
  await requireAdminSession();

  const [params, technologies] = await Promise.all([
    searchParams,
    prisma.technology.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { Project: true },
        },
      },
    }),
  ]);

  const editId = readSearchParam(params.edit);
  const status = readSearchParam(params.status);
  const statusMessage = status ? statusMessages[status] : undefined;

  return (
    <main className="space-y-6">
      {statusMessage ? (
        <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {statusMessage}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Technologies
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Add a technology
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Technologies created here can be assigned to projects from the project
          form.
        </p>

        <div className="mt-6">
          <TechnologyForm action={createTechnologyAction} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Library
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Existing technologies
            </h2>
          </div>
          <p className="text-sm text-slate-400">
            {technologies.length}{" "}
            {technologies.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {technologies.map((technology) => {
            const projectCount = technology._count.Project;
            const usageLabel = `${projectCount} ${
              projectCount === 1 ? "project" : "projects"
            }`;

            if (technology.id === editId) {
              return (
                <div
                  key={technology.id}
                  className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"
                >
                  <TechnologyForm
                    action={updateTechnologyAction}
                    technology={{
                      id: technology.id,
                      name: technology.name,
                      slug: technology.slug,
                    }}
                    cancelHref="/admin/technologies"
                  />
                </div>
              );
            }

            return (
              <article
                key={technology.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-white">
                      {technology.name}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {technology.slug}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-300">
                      {usageLabel}
                    </span>
                    <Link
                      href={`/admin/technologies?edit=${technology.id}`}
                      className="rounded-full border border-slate-700 px-3 py-2 text-center text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
                    >
                      Edit
                    </Link>
                    <DeleteTechnologyButton
                      technologyId={technology.id}
                      technologyName={technology.name}
                      action={deleteTechnologyAction}
                    />
                  </div>
                </div>
              </article>
            );
          })}

          {technologies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center text-slate-400">
              No technologies yet. Add the first one above so it can be assigned
              to projects.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
