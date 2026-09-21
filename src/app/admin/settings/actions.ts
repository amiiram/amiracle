"use server";

import { Locale, ThemeMode, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import {
  SITE_SETTINGS_ID,
  siteSettingsSchema,
  socialLinkSchema,
} from "@/lib/validations/site";
import {
  FORM_VALIDATION_MESSAGE,
  readFieldText,
  toFieldErrors,
  type FormState,
} from "@/lib/validations/form-state";

/**
 * `SiteSettings` is an application-enforced singleton, so every write targets
 * the same literal id and the admin UI can never create a second row.
 *
 * Note: no public route currently reads these values from the database (the
 * public pages render the static defaults in `src/lib/portfolio-data.ts`), so
 * revalidation is limited to the admin page that renders this form.
 */
const ADMIN_SETTINGS_PATH = "/admin/settings";
const SAVE_FAILURE_MESSAGE = "Unable to save the settings. Please try again.";
const LINK_SAVE_FAILURE_MESSAGE =
  "Unable to save this social link. Please try again.";
const MISSING_LINK_MESSAGE =
  "This social link no longer exists. Reload the page and try again.";

export type SiteSettingsFormValues = {
  siteName: string;
  tagline: string;
  description: string;
  email: string;
  defaultLocale: string;
  themeMode: string;
  aboutMarkdown: string;
};

export type SiteSettingsFormState = FormState<SiteSettingsFormValues>;

export type SocialLinkFormValues = {
  linkId: string;
  url: string;
  label: string;
  isVisible: boolean;
};

export type SocialLinkFormState = FormState<SocialLinkFormValues>;

function readSiteSettingsValues(formData: FormData): SiteSettingsFormValues {
  return {
    siteName: readFieldText(formData, "siteName"),
    tagline: readFieldText(formData, "tagline"),
    description: readFieldText(formData, "description"),
    email: readFieldText(formData, "email"),
    defaultLocale: readFieldText(formData, "defaultLocale") || Locale.en,
    themeMode: readFieldText(formData, "themeMode") || ThemeMode.system,
    aboutMarkdown: readFieldText(formData, "aboutMarkdown"),
  };
}

function readSocialLinkValues(formData: FormData): SocialLinkFormValues {
  return {
    linkId: readFieldText(formData, "linkId"),
    url: readFieldText(formData, "url"),
    label: readFieldText(formData, "label"),
    isVisible: formData.get("isVisible") === "on",
  };
}

export async function updateSiteSettingsAction(
  _state: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  await requireAdminSession();

  const values = readSiteSettingsValues(formData);

  const parsed = siteSettingsSchema.safeParse({
    id: SITE_SETTINGS_ID,
    siteName: values.siteName,
    tagline: values.tagline,
    description: values.description,
    email: values.email,
    defaultLocale: values.defaultLocale,
    themeMode: values.themeMode,
    aboutMarkdown: values.aboutMarkdown,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: FORM_VALIDATION_MESSAGE,
      fieldErrors: toFieldErrors(parsed.error),
      values,
    };
  }

  try {
    await prisma.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      update: { ...parsed.data, updatedAt: new Date() },
      create: { ...parsed.data, updatedAt: new Date() },
    });
  } catch {
    return { success: false, message: SAVE_FAILURE_MESSAGE, values };
  }

  revalidatePath(ADMIN_SETTINGS_PATH);
  redirect(`${ADMIN_SETTINGS_PATH}?status=saved`);
}

export async function updateSocialLinkAction(
  _state: SocialLinkFormState,
  formData: FormData,
): Promise<SocialLinkFormState> {
  await requireAdminSession();

  const values = readSocialLinkValues(formData);

  if (!values.linkId.trim()) {
    return { success: false, message: MISSING_LINK_MESSAGE, values };
  }

  try {
    const link = await prisma.socialLink.findUnique({
      where: { id: values.linkId },
      select: { id: true, platform: true },
    });

    if (!link) {
      return { success: false, message: MISSING_LINK_MESSAGE, values };
    }

    // `platform` is the stable identifier of a link, so it is taken from the
    // stored row instead of the client. Only the presentational fields are
    // written back.
    const parsed = socialLinkSchema.safeParse({
      platform: link.platform,
      url: values.url,
      label: values.label,
      isVisible: values.isVisible,
    });

    if (!parsed.success) {
      return {
        success: false,
        message: FORM_VALIDATION_MESSAGE,
        fieldErrors: toFieldErrors(parsed.error),
        values,
      };
    }

    await prisma.socialLink.update({
      where: { id: link.id },
      data: {
        url: parsed.data.url,
        label: parsed.data.label,
        isVisible: parsed.data.isVisible,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { success: false, message: MISSING_LINK_MESSAGE, values };
    }

    return { success: false, message: LINK_SAVE_FAILURE_MESSAGE, values };
  }

  revalidatePath(ADMIN_SETTINGS_PATH);
  redirect(`${ADMIN_SETTINGS_PATH}?status=link-saved`);
}
