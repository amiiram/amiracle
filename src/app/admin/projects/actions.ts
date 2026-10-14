"use server";

import crypto from "node:crypto";

import { Prisma, ProjectMediaType } from "@prisma/client";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { revalidatePortfolio } from "@/lib/admin/revalidate";
import { prisma } from "@/lib/db/prisma";
import {
  projectMediaSchema,
  projectSchema,
} from "@/lib/validations/content";
import {
  readCheckbox,
  readFieldText,
  readIdList,
  toFieldErrors,
} from "@/lib/validations/form-state";

export type ProjectMediaFormValues = {
  id?: string;
  url: string;
  type: string;
  alt: string;
  caption: string;
};

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
  media: ProjectMediaFormValues[];
};

export type ProjectFormState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: ProjectFormValues;
};

const ADMIN_PROJECTS_PATH = "/admin/projects";
const PUBLIC_PROJECT_PATH_PREFIX = "/projects";

/** Hard cap so a tampered payload cannot create an unbounded number of rows. */
const MAX_MEDIA_ITEMS = 50;

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

function getSubmittedValues(formData: FormData): ProjectFormValues {
  return {
    title: readFieldText(formData, "title").trim(),
    slug: readFieldText(formData, "slug").trim(),
    excerpt: readFieldText(formData, "excerpt").trim(),
    description: readFieldText(formData, "description").trim(),
    responsibilities: readFieldText(formData, "responsibilities").trim(),
    status: readFieldText(formData, "status").trim() || "draft",
    visibility: readFieldText(formData, "visibility").trim() || "PUBLIC",
    featured: readCheckbox(formData, "featured"),
    publishedAt: readFieldText(formData, "publishedAt").trim(),
    technologyIds: readIdList(formData, "technologyIds"),
    media: readMediaRows(formData),
  };
}

/**
 * The media list travels with the form as a JSON payload so a failed
 * validation round-trip can hand every row back to the editor untouched.
 * The payload is never trusted: rows are re-validated below and ids are
 * only honored after they are confirmed to belong to the current project.
 */
function readMediaRows(formData: FormData): ProjectMediaFormValues[] {
  const raw = formData.get("mediaJson");

  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.slice(0, MAX_MEDIA_ITEMS).map((entry) => {
      const row = (entry ?? {}) as Record<string, unknown>;

      return {
        id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : undefined,
        url: typeof row.url === "string" ? row.url : "",
        type: typeof row.type === "string" ? row.type : "image",
        alt: typeof row.alt === "string" ? row.alt : "",
        caption: typeof row.caption === "string" ? row.caption : "",
      };
    });
  } catch {
    // A malformed payload is treated the same as an empty list; the editor
    // state the user sees is preserved in the client, not in this field.
    return [];
  }
}

/**
 * Validates every media row with the shared Zod schema and collects the
 * messages under `media.<index>.<field>` keys so the editor can show them
 * next to the exact input that caused the problem.
 */
type MediaRowInput = {
  id?: string;
  url: string;
  type: ProjectMediaType;
  alt: string | null;
  caption: string | null;
};

function validateMediaRows(media: ProjectMediaFormValues[]) {
  const fieldErrors: Record<string, string[]> = {};
  const rows: MediaRowInput[] = [];

  media.forEach((row, index) => {
    const parsed = projectMediaSchema.safeParse({
      url: row.url,
      type: row.type,
      alt: row.alt,
      caption: row.caption,
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field !== "string") {
          continue;
        }

        const key = `media.${index}.${field}`;

        fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
      }

      return;
    }

    rows.push({
      // Only ids confirmed against the project's own rows are ever updated;
      // unknown or tampered ids fall through to the create branch instead.
      id: row.id || undefined,
      url: parsed.data.url,
      type: parsed.data.type,
      alt: parsed.data.alt ? parsed.data.alt : null,
      caption: parsed.data.caption ? parsed.data.caption : null,
    });
  });

  return { fieldErrors, rows };
}

/**
 * Replaces the project's media with the submitted list inside the caller's
 * transaction. Orders are always normalized to 0..n-1 by array position, so
 * the first item is the project banner/cover by definition.
 */
async function syncProjectMedia(
  tx: Prisma.TransactionClient,
  projectId: string,
  media: MediaRowInput[],
) {
  const existingMedia = await tx.projectMedia.findMany({
    where: { projectId },
    select: { id: true },
  });

  const existingIds = new Set(existingMedia.map((item) => item.id));
  const submittedIds = new Set(
    media.flatMap((item) => (item.id ? [item.id] : [])),
  );

  // Delete the rows that were removed in the editor. The `projectId` filter
  // makes the delete a no-op for any id outside this project.
  const removedIds = existingMedia
    .map((item) => item.id)
    .filter((id) => !submittedIds.has(id));

  if (removedIds.length > 0) {
    await tx.projectMedia.deleteMany({
      where: { id: { in: removedIds }, projectId },
    });
  }

  for (const [index, item] of media.entries()) {
    const data = {
      url: item.url,
      type: item.type,
      alt: item.alt,
      caption: item.caption,
      order: index,
    };

    if (item.id && existingIds.has(item.id)) {
      await tx.projectMedia.update({
        where: { id: item.id },
        data,
      });
    } else {
      await tx.projectMedia.create({
        data: {
          id: crypto.randomUUID(),
          projectId,
          ...data,
        },
      });
    }
  }
}

function publicProjectPath(slug: string) {
  return `${PUBLIC_PROJECT_PATH_PREFIX}/${slug}`;
}

/**
 * Public routes that render project data and therefore need a re-render after
 * any project mutation. `revalidatePortfolio` always clears the shared cache
 * *tag* (so the underlying queries refetch), but statically prerendered pages
 * keep serving their old HTML until their own path is invalidated too.
 *
 * - `/` lists published projects.
 * - `/experience` and `/about` embed related-project previews.
 * - `/sitemap.xml` enumerates project URLs.
 *
 * The project detail path(s) are appended per mutation by the caller.
 */
const PROJECT_PUBLIC_PATHS = ["/", "/experience", "/about", "/sitemap.xml"];

/**
 * Revalidates the admin list plus every public route affected by a project
 * change. Pass the detail path(s) for the project(s) that changed so their own
 * pages are refreshed alongside the listings.
 */
function revalidateProjectMutation(detailPaths: ReadonlyArray<string> = []) {
  revalidatePortfolio([
    ADMIN_PROJECTS_PATH,
    ...PROJECT_PUBLIC_PATHS,
    ...detailPaths,
  ]);
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
      fieldErrors: toFieldErrors(parsed.error),
      values,
    };
  }

  const technologyIds = values.technologyIds.filter(Boolean);

  const { fieldErrors: mediaFieldErrors, rows: mediaRows } = validateMediaRows(
    values.media,
  );

  if (Object.keys(mediaFieldErrors).length > 0) {
    return {
      success: false,
      message: "Please fix the highlighted media fields and try again.",
      fieldErrors: mediaFieldErrors,
      values,
    };
  }

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

    const projectId = crypto.randomUUID();

    // The project and its media are written atomically: a failed media write
    // must never leave a project behind with half of its gallery stored.
    await prisma.$transaction(async (tx) => {
      await tx.project.create({
        data: {
          id: projectId,
          ...parsed.data,
          updatedAt: new Date(),
          Technology: {
            connect: technologyIds.map((id) => ({ id })),
          },
        },
      });

      await syncProjectMedia(tx, projectId, mediaRows);
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

  revalidateProjectMutation([publicProjectPath(parsed.data.slug)]);
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
      fieldErrors: toFieldErrors(parsed.error),
      values,
    };
  }

  const technologyIds = values.technologyIds.filter(Boolean);

  const { fieldErrors: mediaFieldErrors, rows: mediaRows } = validateMediaRows(
    values.media,
  );

  if (Object.keys(mediaFieldErrors).length > 0) {
    return {
      success: false,
      message: "Please fix the highlighted media fields and try again.",
      fieldErrors: mediaFieldErrors,
      values,
    };
  }

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

    // A missing or mistyped project id is reported safely instead of letting
    // the database throw an opaque error.
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, slug: true },
    });

    if (!project) {
      return {
        success: false,
        message: "This project no longer exists. It may have been deleted.",
        values,
      };
    }

    // The project and its media are written atomically, and media ids are
    // only honored for rows that belong to this project (verified above by
    // loading the project's own rows inside syncProjectMedia).
    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          ...parsed.data,
          updatedAt: new Date(),
          Technology: {
            set: technologyIds.map((id) => ({ id })),
          },
        },
      });

      await syncProjectMedia(tx, projectId, mediaRows);
    });

    // Refresh both the old and new detail URLs when the slug changed, alongside
    // the shared admin/public listing paths.
    const detailPaths = [publicProjectPath(project.slug)];

    if (project.slug !== parsed.data.slug) {
      detailPaths.push(publicProjectPath(parsed.data.slug));
    }

    revalidateProjectMutation(detailPaths);
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

  redirect(ADMIN_PROJECTS_PATH);
}

export async function deleteProjectAction(formData: FormData) {
  await requireAdminSession();

  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    return;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { slug: true },
  });

  if (!project) {
    return;
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  revalidateProjectMutation([publicProjectPath(project.slug)]);
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

  // Toggling publish state changes whether the project is publicly visible, so
  // the detail page and every listing must refresh, not just the admin list.
  revalidateProjectMutation([publicProjectPath(project.slug)]);
}
