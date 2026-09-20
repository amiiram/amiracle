import { z } from "zod";

import { ProjectMediaType, ProjectStatus, ProjectVisibility } from "@prisma/client";

/**
 * Date-only values map to PostgreSQL `DATE` columns (`DateTime @db.Date`).
 * They are parsed and produced as UTC midnight so storage and display never
 * drift by a calendar day between timezones.
 */
const toUtcDateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);

/**
 * Rejects impossible calendar dates such as `2026-02-31` instead of letting the
 * engine silently roll them over into the following month.
 */
const isRealCalendarDate = (value: string) => {
  const parsed = toUtcDateOnly(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const dateOnlyString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format")
  .refine(isRealCalendarDate, "Enter a valid calendar date");

const optionalDateOnly = dateOnlyString
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? toUtcDateOnly(value) : null));

/** ISO-8601 timestamps, accepting an empty string for "not set". */
const optionalTimestamp = z
  .string()
  .datetime()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? new Date(value) : null));

/** Slugs are normalized to lowercase kebab-case to match the unique DB keys. */
const slugString = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120)
  .transform((value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  )
  .refine((value) => value.length > 0, "Slug must contain a letter or number");

export const projectSchema = z
  .object({
    slug: slugString,
    title: z.string().trim().min(1).max(160),
    excerpt: z.string().trim().max(280).optional(),
    // The single long-form Markdown narrative for a project.
    description: z.string().trim().max(4000).optional(),
    // Ordered bullet list rendered as the project's responsibilities.
    responsibilities: z.array(z.string().trim().min(1).max(200)).default([]),
    featured: z.boolean().default(false),
    status: z.enum(ProjectStatus).default(ProjectStatus.draft),
    visibility: z.enum(ProjectVisibility).default(ProjectVisibility.PUBLIC),
    publishedAt: optionalTimestamp,
  })
  .transform((project) => ({
    ...project,
    // Publishing rule: a published project always carries `publishedAt`, so it is
    // stamped here when the editor did not supply one. Drafts may stay null.
    publishedAt:
      project.status === ProjectStatus.published && project.publishedAt === null
        ? new Date()
        : project.publishedAt,
  }));

/**
 * `ProjectMedia` stores absolute URL references only (object storage or external
 * hosts). No binary payload is ever persisted in PostgreSQL.
 */
export const projectMediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(ProjectMediaType).default(ProjectMediaType.image),
  alt: z.string().trim().max(200).optional(),
  caption: z.string().trim().max(300).optional(),
  order: z.number().int().min(0).default(0),
});

export const experienceSchema = z
  .object({
    company: z.string().trim().min(1).max(160),
    role: z.string().trim().min(1).max(160),
    location: z.string().trim().max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    startDate: dateOnlyString.transform(toUtcDateOnly),
    endDate: optionalDateOnly,
    isCurrent: z.boolean().default(false),
  })
  .superRefine((experience, ctx) => {
    // A current role must not carry an end date.
    if (experience.isCurrent && experience.endDate !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "A current role must not have an end date",
      });
      return;
    }
    if (experience.endDate !== null && experience.endDate < experience.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must not be before the start date",
      });
    }
  });

export const educationSchema = z
  .object({
    school: z.string().trim().min(1).max(160),
    degree: z.string().trim().min(1).max(160),
    field: z.string().trim().max(160).optional(),
    description: z.string().trim().max(2000).optional(),
    startDate: dateOnlyString.transform(toUtcDateOnly),
    endDate: optionalDateOnly,
  })
  .superRefine((education, ctx) => {
    if (education.endDate !== null && education.endDate < education.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must not be before the start date",
      });
    }
  });

export const certificationSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    issuer: z.string().trim().max(160).optional(),
    credentialId: z.string().trim().max(160).optional(),
    obtainedAt: optionalDateOnly,
    expiresAt: optionalDateOnly,
    url: z.string().url().optional().or(z.literal("")),
  })
  .superRefine((certification, ctx) => {
    if (
      certification.obtainedAt !== null &&
      certification.expiresAt !== null &&
      certification.expiresAt < certification.obtainedAt
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Expiry date must not be before the obtained date",
      });
    }
  });

export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectMediaInput = z.infer<typeof projectMediaSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
