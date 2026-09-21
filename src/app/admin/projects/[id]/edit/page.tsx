import { notFound } from "next/navigation";

import { updateProjectAction } from "@/app/admin/projects/actions";
import { ProjectForm } from "@/components/admin/project-form";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      Technology: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const technologyOptions = await prisma.technology.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <main className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Projects
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Edit project</h2>
      </div>

      <ProjectForm
        action={updateProjectAction.bind(null, project.id)}
        technologyOptions={technologyOptions}
        project={{
          id: project.id,
          slug: project.slug,
          title: project.title,
          excerpt: project.excerpt,
          description: project.description,
          responsibilities: project.responsibilities,
          featured: project.featured,
          status: project.status,
          visibility: project.visibility,
          publishedAt: project.publishedAt
            ? project.publishedAt.toISOString()
            : null,
          technologies: project.Technology,
        }}
      />
    </main>
  );
}
