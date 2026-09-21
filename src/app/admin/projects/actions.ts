"use server";

import crypto from "node:crypto";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { projectSchema } from "@/lib/validations/content";

export type ProjectFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  responsibilities: string;
  status: string;
  visibility: string;
  featured: boolean;
  publishedAt: string;
  technologyIds: string[];
};

export type ProjectFormState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: ProjectFormValues;
};

const ADMIN_PROJECTS_PATH = "/admin/projects";

function normalizePublishedAt(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  return new Date(`${value}T12:00:00.000Z`).toISOString();
}

function normalizeResponsibilities(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [] as string[];
  }

  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toFieldErrors(error: {
  fieldErrors?: Record<string, string[] | undefined>;
  issues?: { path: (string | number)[]; message: string }[];
}): Record<string, string[]> {
  // If the error has fieldErrors from a flatten operation, use those
  if (error.fieldErrors) {
    return Object.fromEntries(
      Object.entries(error.fieldErrors).flatMap(([key, value]) => [
        [key, value ?? []],
      ]),
    ) as Record<string, string[]>;
  }

  // Fallback: build field errors from Zod issues directly
  const fieldErrors: Record<string, string[]> = {};

  if (error.issues) {
    for (const issue of error.issues) {
      const [field] = issue.path;

      if (typeof field !== "string") {
        continue;
      }

      fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
    }
  }

  return fieldErrors;
}

function getSubmittedValues(formData: FormData): ProjectFormValues {
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    responsibilities: String(formData.get("responsibilities") ?? "").trim(),
    status: String(formData.get("status") ?? "draft").trim(),
    visibility: String(formData.get("visibility") ?? "PUBLIC").trim(),
    featured: formData.get("featured") === "on",
    publishedAt: String(formData.get("publishedAt") ?? "").trim(),
    technologyIds: formData
      .getAll("technologyIds")
      .map((value) => String(value)),
  };
}

async function validateTechnologySelection(technologyIds: string[]) {
  if (technologyIds.length === 0) {
    return;
  }

  const uniqueIds = [...new Set(technologyIds)];
  const validTechnologies = await prisma.technology.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });

  const validIds = new Set(
    validTechnologies.map((technology) => technology.id),
  );
  const invalidIds = uniqueIds.filter((id) => !validIds.has(id));

  if (invalidIds.length > 0) {
    throw new Error(`Invalid technology selection: ${invalidIds.join(", ")}`);
  }
}

export async function createProjectAction(
  state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireAdminSession();

  const values = getSubmittedValues(formData);

  const parsed = projectSchema.safeParse({
    slug: values.slug,
    title: values.title,
    excerpt: values.excerpt,
    description: values.description,
    responsibilities: normalizeResponsibilities(
      formData.get("responsibilities"),
    ),
    featured: values.featured,
    status: values.status,
    visibility: values.visibility,
    publishedAt: normalizePublishedAt(formData.get("publishedAt")),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted project fields and try again.",
      fieldErrors: toFieldErrors(parsed.error.flatten()),
      values,
    };
  }

  const technologyIds = values.technologyIds.filter(Boolean);

  try {
    await validateTechnologySelection(technologyIds);

    const existingProject = await prisma.project.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existingProject) {
      return {
        success: false,
        message: `A project with the slug "${parsed.data.slug}" already exists. Use a different slug.`,
        fieldErrors: { slug: [`The slug "${parsed.data.slug}" is already in use. Choose a different slug.`] },
        values,
      };
    }

    await prisma.project.create({
      data: {
        id: crypto.randomUUID(),
        ...parsed.data,
        updatedAt: new Date(),
        Technology: {
          connect: technologyIds.map((id) => ({ id })),
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          message: `A project with the slug "${parsed.data.slug}" already exists. Use a different slug.`,
          fieldErrors: { slug: [`The slug "${parsed.data.slug}" is already in use. Choose a different slug.`] },
          values,
        };
      }
      if (error.code === "P2025" || error.code === "P2023") {
        return {
          success: false,
          message: "One or more selected technology values are invalid.",
          fieldErrors: { technologyIds: ["One or more selected technology values are invalid."] },
          values,
        };
      }
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Invalid technology selection")
    ) {
      return {
        success: false,
        message: "One or more selected technology values are invalid.",
        fieldErrors: { technologyIds: ["One or more selected technology values are invalid."] },
        values,
      };
    }

    return {
      success: false,
      message:
        "The project could not be saved. Please review the form and try again.",
      values,
    };
  }

  revalidatePath(ADMIN_PROJECTS_PATH);
  redirect(ADMIN_PROJECTS_PATH);
}

export async function updateProjectAction(
  projectId: string,
  state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireAdminSession();

  const values = getSubmittedValues(formData);

  const parsed = projectSchema.safeParse({
    slug: values.slug,
    title: values.title,
    excerpt: values.excerpt,
    description: values.description,
    responsibilities: normalizeResponsibilities(
      formData.get("responsibilities"),
    ),
    featured: values.featured,
    status: values.status,
    visibility: values.visibility,
    publishedAt: normalizePublishedAt(formData.get("publishedAt")),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted project fields and try again.",
      fieldErrors: toFieldErrors(parsed.error.flatten()),
      values,
    };
  }

  const technologyIds = values.technologyIds.filter(Boolean);

  try {
    await validateTechnologySelection(technologyIds);

    const existingProject = await prisma.project.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existingProject && existingProject.id !== projectId) {
      return {
        success: false,
        message: `A project with the slug "${parsed.data.slug}" already exists. Use a different slug.`,
        fieldErrors: { slug: [`The slug "${parsed.data.slug}" is already in use. Choose a different slug.`] },
        values,
      };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        ...parsed.data,
        updatedAt: new Date(),
        Technology: {
          set: technologyIds.map((id) => ({ id })),
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          message: `A project with the slug "${parsed.data.slug}" already exists. Use a different slug.`,
          fieldErrors: { slug: [`The slug "${parsed.data.slug}" is already in use. Choose a different slug.`] },
          values,
        };
      }
      if (error.code === "P2025" || error.code === "P2023") {
        return {
          success: false,
          message: "One or more selected technology values are invalid.",
          fieldErrors: { technologyIds: ["One or more selected technology values are invalid."] },
          values,
        };
      }
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Invalid technology selection")
    ) {
      return {
        success: false,
        message: "One or more selected technology values are invalid.",
        fieldErrors: { technologyIds: ["One or more selected technology values are invalid."] },
        values,
      };
    }

    return {
      success: false,
      message:
        "The project could not be saved. Please review the form and try again.",
      values,
    };
  }

  revalidatePath(ADMIN_PROJECTS_PATH);
  redirect(ADMIN_PROJECTS_PATH);
}

export async function deleteProjectAction(formData: FormData) {
  await requireAdminSession();

  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    return;
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  revalidatePath(ADMIN_PROJECTS_PATH);
}

export async function toggleProjectPublishAction(formData: FormData) {
  await requireAdminSession();

  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    return;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return;
  }

  const nextStatus = project.status === "published" ? "draft" : "published";

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: nextStatus,
      publishedAt:
        nextStatus === "published"
          ? (project.publishedAt ?? new Date())
          : project.publishedAt,
    },
  });

  revalidatePath(ADMIN_PROJECTS_PATH);
}
