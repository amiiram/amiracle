import { createProjectAction } from "@/app/admin/projects/actions";
import { ProjectForm } from "@/components/admin/project-form";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export default async function NewProjectPage() {
  await requireAdminSession();

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
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Create project
        </h2>
      </div>

      <ProjectForm
        action={createProjectAction}
        technologyOptions={technologyOptions}
      />
    </main>
  );
}
