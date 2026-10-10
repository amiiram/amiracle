import Link from "next/link";

import {
  createExperienceAction,
  deleteExperienceAction,
  updateExperienceAction,
} from "@/app/admin/experience/actions";
import { DeleteExperienceButton } from "@/components/admin/delete-experience-button";
import { ExperienceForm } from "@/components/admin/experience-form";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const statusMessages: Record<string, string> = {
  created: "Experience added.",
  updated: "Experience updated.",
  deleted: "Experience deleted.",
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toDateInputValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export default async function AdminExperiencePage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string | string[];
    status?: string | string[];
  }>;
}) {
  await requireAdminSession();

  const [params, experiences, projects, technologies] = await Promise.all([
    searchParams,
    prisma.experience.findMany({
      orderBy: [{ startDate: "desc" }, { company: "asc" }],
      include: {
        Project: {
          select: { id: true, title: true, slug: true },
          orderBy: { title: "asc" },
        },
        Technology: {
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
    }),
    prisma.project.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        visibility: true,
      },
    }),
    prisma.technology.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const projectOptions = projects.map((project) => ({
    id: project.id,
    label: `${project.title} · ${project.slug}`,
    searchText: `${project.status} ${project.visibility}`,
  }));
  const technologyOptions = technologies.map((technology) => ({
    id: technology.id,
    label: technology.name,
  }));

  const editId = readSearchParam(params.edit);
  const status = readSearchParam(params.status);
  const statusMessage = status ? statusMessages[status] : undefined;

  return (
    <main className="space-y-6">
      {statusMessage ? (
        <p
          role="status"
          className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
        >
          {statusMessage}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Experience
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Add a role
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Add only accurate role details. Entries appear on the public
          experience page.
        </p>

        <div className="mt-6">
          <ExperienceForm
            action={createExperienceAction}
            projectOptions={projectOptions}
            technologyOptions={technologyOptions}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Records
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Existing experience
            </h2>
          </div>
          <p className="text-sm text-slate-400">
            {experiences.length}{" "}
            {experiences.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        <div className="space-y-4">
          {experiences.map((experience) => {
            if (experience.id === editId) {
              return (
                <article
                  key={experience.id}
                  className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 sm:p-5"
                >
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Editing
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {experience.role} at {experience.company}
                    </h3>
                  </div>
                  <ExperienceForm
                    action={updateExperienceAction.bind(null, experience.id)}
                    experience={{
                      id: experience.id,
                      slug: experience.slug,
                      company: experience.company,
                      role: experience.role,
                      location: experience.location ?? "",
                      summary: experience.summary ?? "",
                      startDate: toDateInputValue(experience.startDate),
                      endDate: toDateInputValue(experience.endDate),
                      isCurrent: experience.isCurrent,
                      description: experience.description ?? "",
                      projectIds: experience.Project.map((project) => project.id),
                      technologyIds: experience.Technology.map(
                        (technology) => technology.id,
                      ),
                    }}
                    projectOptions={projectOptions}
                    technologyOptions={technologyOptions}
                    cancelHref="/admin/experience"
                  />
                </article>
              );
            }

            return (
              <article
                key={experience.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">
                          {experience.role}
                        </h3>
                        {experience.isCurrent ? (
                          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
                            Current
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-300">
                        {experience.company}
                        {experience.location
                          ? ` · ${experience.location}`
                          : ""}
                      </p>
                    </div>

                    <p className="text-sm text-slate-400">
                      {formatDate(experience.startDate)}
                      {experience.isCurrent
                        ? " – Present"
                        : experience.endDate
                          ? ` – ${formatDate(experience.endDate)}`
                          : ""}
                    </p>

                    {experience.description ? (
                      <p className="text-xs text-slate-500">
                        Markdown description added
                      </p>
                    ) : null}
                    {experience.summary ? (
                      <p className="text-sm leading-6 text-slate-300">
                        {experience.summary}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {experience.Project.map((project) => (
                        <span
                          key={project.id}
                          className="rounded-full border border-slate-700 px-2 py-1 text-slate-300"
                        >
                          {project.title}
                        </span>
                      ))}
                      {experience.Technology.map((technology) => (
                        <span
                          key={technology.id}
                          className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1 text-slate-400"
                        >
                          {technology.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <Link
                      href={`/experience/${encodeURIComponent(experience.slug)}`}
                      className="rounded-full border border-slate-700 px-3 py-2 text-center text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
                    >
                      View public page
                    </Link>
                    <Link
                      href={`/admin/experience?edit=${encodeURIComponent(experience.id)}`}
                      className="rounded-full border border-slate-700 px-3 py-2 text-center text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
                    >
                      Edit
                    </Link>
                    <DeleteExperienceButton
                      experienceId={experience.id}
                      role={experience.role}
                      company={experience.company}
                      action={deleteExperienceAction}
                    />
                  </div>
                </div>
              </article>
            );
          })}

          {experiences.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center text-slate-400">
              No experience records yet. Add a role above when you are ready.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
