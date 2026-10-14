import { z } from "zod";

import { Locale, ThemeMode } from "@prisma/client";

/**
 * `SiteSettings` is an application-enforced singleton: every read and write
 * targets this literal id, mirroring the `@default("site_settings")` primary key
 * in the schema. PostgreSQL does not enforce the single-row invariant, so all
 * access must go through this constant.
 */
export const SITE_SETTINGS_ID = "site_settings" as const;

export const siteSettingsSchema = z.object({
  id: z.literal(SITE_SETTINGS_ID).default(SITE_SETTINGS_ID),
  siteName: z.string().trim().min(1).max(120).optional(),
  tagline: z.string().trim().max(180).optional(),
  description: z.string().trim().max(500).optional(),
  email: z.email().optional().or(z.literal("")),
  defaultLocale: z.enum(Locale).default(Locale.en),
  themeMode: z.enum(ThemeMode).default(ThemeMode.system),
  // Long-form Markdown narrative rendered on the about page.
  aboutMarkdown: z.string().trim().max(4000).optional(),
});

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(60),
  url: z.url(),
  label: z.string().trim().max(80).optional(),
  isVisible: z.boolean().default(true),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
