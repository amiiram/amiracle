"use server";

import crypto from "node:crypto";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { experienceSchema } from "@/lib/validations/content";
import {
  FORM_VALIDATION_MESSAGE,
  readFieldText,
  toFieldErrors,
  type FormState,
} from "@/lib/validations/form-state";

const ADMIN_EXPERIENCE_PATH = "/admin/experience";
const PUBLIC_EXPERIENCE_PATH = "/experience";
const ABOUT_PATH = "/about";

export type ExperienceFormValues = {
  slug: string;
  company: string;
  role: string;
  location: string;
  summary: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  projectIds: string[];
  technologyIds: string[];
};

export type ExperienceFormState = FormState<ExperienceFormValues>;

function readExperienceValues(formData: FormData): ExperienceFormValues {
  return {
    slug: readFieldText(formData, "slug"),
    company: readFieldText(formData, "company"),
    role: readFieldText(formData, "role"),
    location: readFieldText(formData, "location"),
    summary: readFieldText(formData, "summary"),
    startDate: readFieldText(formData, "startDate"),
    endDate: readFieldText(formData, "endDate"),
    isCurrent: formData.get("isCurrent") === "on",
    description: readFieldText(formData, "description"),
    projectIds: formData.getAll("projectIds").map((value) =>
      typeof value === "string" ? value : "",
    ),
    technologyIds: formData.getAll("technologyIds").map((value) =>
      typeof value === "string" ? value : "",
    ),
  };
}

function validationFailure(
  values: ExperienceFormValues,
  fieldErrors: Record<string, string[]>,
): ExperienceFormState {
  return {
    success: false,
    message: FORM_VALIDATION_MESSAGE,
    fieldErrors,
    values,
  };
}

function logActionError(message: string, error: unknown) {
  console.error(
    message,
    error instanceof Error ? error.name : "Unknown error",
  );
}

function revalidateExperiencePaths() {
  revalidatePath(ADMIN_EXPERIENCE_PATH);
  revalidatePath(PUBLIC_EXPERIENCE_PATH);
  revalidatePath(ABOUT_PATH);
}

function duplicateSlugFailure(
  values: ExperienceFormValues,
): ExperienceFormState {
  return validationFailure(values, {
    slug: ["This slug is already in use. Choose a different slug."],
  });
}

async function validateRelatedItems(
  projectIds: string[],
  technologyIds: string[],
) {
  const [projects, technologies] = await Promise.all([
    projectIds.length > 0
      ? prisma.project.findMany({
          where: { id: { in: projectIds } },
          select: { id: true },
        })
      : [],
    technologyIds.length > 0
      ? prisma.technology.findMany({
          where: { id: { in: technologyIds } },
          select: { id: true },
        })
      : [],
  ]);

  return {
    projectsValid: projects.length === projectIds.length,
    technologiesValid: technologies.length === technologyIds.length,
  };
}

function invalidRelationshipsFailure(
  values: ExperienceFormValues,
  projectsValid: boolean,
  technologiesValid: boolean,
): ExperienceFormState {
  const fieldErrors: Record<string, string[]> = {};

  if (!projectsValid) {
    fieldErrors.projectIds = [
      "One or more selected projects are no longer available. Reload and try again.",
    ];
  }
  if (!technologiesValid) {
    fieldErrors.technologyIds = [
      "One or more selected technologies are no longer available. Reload and try again.",
    ];
  }

  return validationFailure(values, fieldErrors);
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function invalidRelatedItemError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2025" || error.code === "P2023")
  );
}

export async function createExperienceAction(
  _state: ExperienceFormState,
  formData: FormData,
): Promise<ExperienceFormState> {
  await requireAdminSession();

  const values = readExperienceValues(formData);
  const parsed = experienceSchema.safeParse(values);

  if (!parsed.success) {
    return validationFailure(values, toFieldErrors(parsed.error));
  }

  try {
    const relatedItems = await validateRelatedItems(
      parsed.data.projectIds,
      parsed.data.technologyIds,
    );

    if (!relatedItems.projectsValid || !relatedItems.technologiesValid) {
      return invalidRelationshipsFailure(
        values,
        relatedItems.projectsValid,
        relatedItems.technologiesValid,
      );
    }

    await prisma.experience.create({
      data: {
        id: crypto.randomUUID(),
        slug: parsed.data.slug,
        company: parsed.data.company,
        role: parsed.data.role,
        location: parsed.data.location || null,
        summary: parsed.data.summary || null,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        isCurrent: parsed.data.isCurrent,
        description: parsed.data.description || null,
        updatedAt: new Date(),
        Project: {
          connect: parsed.data.projectIds.map((id) => ({ id })),
        },
        Technology: {
          connect: parsed.data.technologyIds.map((id) => ({ id })),
        },
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return duplicateSlugFailure(values);
    }
    if (invalidRelatedItemError(error)) {
      return invalidRelationshipsFailure(values, false, false);
    }

    logActionError("Unable to create experience record.", error);
    return {
      success: false,
      message: "Unable to save this experience. Please try again.",
      values,
    };
  }

  revalidateExperiencePaths();
  redirect(`${ADMIN_EXPERIENCE_PATH}?status=created`);
}

export async function updateExperienceAction(
  experienceId: string,
  _state: ExperienceFormState,
  formData: FormData,
): Promise<ExperienceFormState> {
  await requireAdminSession();

  const values = readExperienceValues(formData);
  const parsed = experienceSchema.safeParse(values);

  if (!parsed.success) {
    return validationFailure(values, toFieldErrors(parsed.error));
  }

  let previousSlug: string;

  try {
    const [existingExperience, slugOwner] = await Promise.all([
      prisma.experience.findUnique({
        where: { id: experienceId },
        select: { slug: true },
      }),
      prisma.experience.findUnique({
        where: { slug: parsed.data.slug },
        select: { id: true },
      }),
    ]);

    if (!existingExperience) {
      return {
        success: false,
        message: "This experience no longer exists. Reload and try again.",
        values,
      };
    }
    if (slugOwner && slugOwner.id !== experienceId) {
      return duplicateSlugFailure(values);
    }

    previousSlug = existingExperience.slug;

    const relatedItems = await validateRelatedItems(
      parsed.data.projectIds,
      parsed.data.technologyIds,
    );

    if (!relatedItems.projectsValid || !relatedItems.technologiesValid) {
      return invalidRelationshipsFailure(
        values,
        relatedItems.projectsValid,
        relatedItems.technologiesValid,
      );
    }

    await prisma.experience.update({
      where: { id: experienceId },
      data: {
        slug: parsed.data.slug,
        company: parsed.data.company,
        role: parsed.data.role,
        location: parsed.data.location || null,
        summary: parsed.data.summary || null,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        isCurrent: parsed.data.isCurrent,
        description: parsed.data.description || null,
        updatedAt: new Date(),
        Project: {
          set: parsed.data.projectIds.map((id) => ({ id })),
        },
        Technology: {
          set: parsed.data.technologyIds.map((id) => ({ id })),
        },
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return duplicateSlugFailure(values);
    }
    if (invalidRelatedItemError(error)) {
      return invalidRelationshipsFailure(values, false, false);
    }

    logActionError("Unable to update experience record.", error);
    return {
      success: false,
      message: "Unable to save this experience. Please try again.",
      values,
    };
  }

  revalidateExperiencePaths();
  revalidatePath(`${PUBLIC_EXPERIENCE_PATH}/${previousSlug}`);
  revalidatePath(`${PUBLIC_EXPERIENCE_PATH}/${values.slug}`);
  redirect(`${ADMIN_EXPERIENCE_PATH}?status=updated`);
}

export async function deleteExperienceAction(
  _state: ExperienceFormState,
  formData: FormData,
): Promise<ExperienceFormState> {
  await requireAdminSession();

  const experienceId = readFieldText(formData, "experienceId").trim();

  if (!experienceId) {
    return {
      success: false,
      message: "This experience could not be identified. Reload and try again.",
    };
  }

  let deletedSlug: string;

  try {
    const deleted = await prisma.experience.delete({
      where: { id: experienceId },
      select: { slug: true },
    });
    deletedSlug = deleted.slug;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        message: "This experience no longer exists. Reload and try again.",
      };
    }

    logActionError("Unable to delete experience record.", error);
    return {
      success: false,
      message: "Unable to delete this experience. Please try again.",
    };
  }

  revalidatePath(`${PUBLIC_EXPERIENCE_PATH}/${deletedSlug}`);
  revalidateExperiencePaths();
  redirect(`${ADMIN_EXPERIENCE_PATH}?status=deleted`);
}
