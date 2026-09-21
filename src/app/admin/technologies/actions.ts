"use server";

import crypto from "node:crypto";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { technologySchema } from "@/lib/validations/content";
import {
  FORM_VALIDATION_MESSAGE,
  readFieldText,
  toFieldErrors,
  type FormState,
} from "@/lib/validations/form-state";

const ADMIN_TECHNOLOGIES_PATH = "/admin/technologies";
const ADMIN_PROJECTS_PATH = "/admin/projects";
// The public home page is prerendered from the database, so technology renames
// have to invalidate it as well.
const HOME_PATH = "/";

const SAVE_FAILURE_MESSAGE = "Unable to save the technology. Please try again.";
const DELETE_FAILURE_MESSAGE =
  "Unable to delete the technology. Please try again.";
const MISSING_TECHNOLOGY_MESSAGE =
  "This technology no longer exists. Reload the page and try again.";

export type TechnologyFormValues = {
  name: string;
  slug: string;
};

export type TechnologyFormState = FormState<TechnologyFormValues>;

function readTechnologyValues(formData: FormData): TechnologyFormValues {
  return {
    name: readFieldText(formData, "name"),
    slug: readFieldText(formData, "slug"),
  };
}

function validationFailure(
  fieldErrors: Record<string, string[]>,
  values: TechnologyFormValues,
): TechnologyFormState {
  return {
    success: false,
    message: FORM_VALIDATION_MESSAGE,
    fieldErrors,
    values,
  };
}

function duplicateSlugFailure(
  slug: string,
  values: TechnologyFormValues,
): TechnologyFormState {
  return validationFailure(
    {
      slug: [`The slug "${slug}" is already in use. Choose a different slug.`],
    },
    values,
  );
}

function duplicateNameFailure(
  name: string,
  values: TechnologyFormValues,
): TechnologyFormState {
  return validationFailure(
    { name: [`A technology named "${name}" already exists.`] },
    values,
  );
}

function missingTechnologyFailure(
  values?: TechnologyFormValues,
): TechnologyFormState {
  return { success: false, message: MISSING_TECHNOLOGY_MESSAGE, values };
}

/**
 * Zod passed, so anything failing here is a database problem: report it as a
 * duplicate field (when the database says so) or as a server error.
 */
function databaseFailure(
  error: unknown,
  submitted: TechnologyFormValues,
  normalized: TechnologyFormValues,
): TechnologyFormState {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target.map(String) : [];

      if (fields.includes("slug")) {
        return duplicateSlugFailure(normalized.slug, submitted);
      }

      if (fields.includes("name")) {
        return duplicateNameFailure(normalized.name, submitted);
      }
    }

    if (error.code === "P2025") {
      return missingTechnologyFailure(submitted);
    }
  }

  return {
    success: false,
    message: SAVE_FAILURE_MESSAGE,
    values: submitted,
  };
}

function deleteFailure(error: unknown): TechnologyFormState {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return missingTechnologyFailure();
    }

    if (error.code === "P2003" || error.code === "P2014") {
      return {
        success: false,
        message:
          "This technology is still linked to projects and cannot be deleted. Remove it from those projects first.",
      };
    }
  }

  return { success: false, message: DELETE_FAILURE_MESSAGE };
}

function revalidateTechnologyPaths() {
  revalidatePath(ADMIN_TECHNOLOGIES_PATH);
  revalidatePath(ADMIN_PROJECTS_PATH);
  revalidatePath(HOME_PATH);
}

/** True when another technology already owns the given name or slug. */
async function technologyExists(where: Prisma.TechnologyWhereInput) {
  const existing = await prisma.technology.findFirst({
    where,
    select: { id: true },
  });

  return Boolean(existing);
}

export async function createTechnologyAction(
  _state: TechnologyFormState,
  formData: FormData,
): Promise<TechnologyFormState> {
  await requireAdminSession();

  const values = readTechnologyValues(formData);

  const parsed = technologySchema.safeParse({
    name: values.name,
    slug: values.slug,
  });

  if (!parsed.success) {
    return validationFailure(toFieldErrors(parsed.error), values);
  }

  try {
    if (await technologyExists({ slug: parsed.data.slug })) {
      return duplicateSlugFailure(parsed.data.slug, values);
    }

    if (await technologyExists({ name: parsed.data.name })) {
      return duplicateNameFailure(parsed.data.name, values);
    }

    await prisma.technology.create({
      data: {
        id: crypto.randomUUID(),
        name: parsed.data.name,
        slug: parsed.data.slug,
        order: 0,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    return databaseFailure(error, values, parsed.data);
  }

  revalidateTechnologyPaths();
  redirect(`${ADMIN_TECHNOLOGIES_PATH}?status=created`);
}

export async function updateTechnologyAction(
  _state: TechnologyFormState,
  formData: FormData,
): Promise<TechnologyFormState> {
  await requireAdminSession();

  const technologyId = readFieldText(formData, "technologyId").trim();
  const values = readTechnologyValues(formData);

  if (!technologyId) {
    return missingTechnologyFailure(values);
  }

  const parsed = technologySchema.safeParse({
    name: values.name,
    slug: values.slug,
  });

  if (!parsed.success) {
    return validationFailure(toFieldErrors(parsed.error), values);
  }

  try {
    const technology = await prisma.technology.findUnique({
      where: { id: technologyId },
      select: { id: true },
    });

    if (!technology) {
      return missingTechnologyFailure(values);
    }

    if (
      await technologyExists({
        slug: parsed.data.slug,
        id: { not: technologyId },
      })
    ) {
      return duplicateSlugFailure(parsed.data.slug, values);
    }

    if (
      await technologyExists({
        name: parsed.data.name,
        id: { not: technologyId },
      })
    ) {
      return duplicateNameFailure(parsed.data.name, values);
    }

    // Only the tag itself changes: the implicit `_ProjectToTechnology` join
    // table is keyed by id, so project relations stay intact.
    await prisma.technology.update({
      where: { id: technologyId },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    return databaseFailure(error, values, parsed.data);
  }

  revalidateTechnologyPaths();
  redirect(`${ADMIN_TECHNOLOGIES_PATH}?status=updated`);
}

export async function deleteTechnologyAction(
  _state: TechnologyFormState,
  formData: FormData,
): Promise<TechnologyFormState> {
  await requireAdminSession();

  const technologyId = readFieldText(formData, "technologyId").trim();

  if (!technologyId) {
    return missingTechnologyFailure();
  }

  try {
    const technology = await prisma.technology.findUnique({
      where: { id: technologyId },
      select: { _count: { select: { Project: true } } },
    });

    if (!technology) {
      return missingTechnologyFailure();
    }

    // Never cascade project relations away: a technology that is still in use
    // has to be removed from those projects first.
    if (technology._count.Project > 0) {
      const projects = technology._count.Project === 1 ? "project" : "projects";

      return {
        success: false,
        message: `This technology is used by ${technology._count.Project} ${projects} and cannot be deleted. Remove it from those projects first.`,
      };
    }

    await prisma.technology.delete({ where: { id: technologyId } });
  } catch (error) {
    return deleteFailure(error);
  }

  revalidateTechnologyPaths();
  redirect(`${ADMIN_TECHNOLOGIES_PATH}?status=deleted`);
}
