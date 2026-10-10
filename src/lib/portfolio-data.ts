import { cache } from "react";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { SITE_SETTINGS_ID } from "@/lib/validations/site";
import { isPublicProject } from "@/lib/project-visibility.mjs";

export type SocialLink = {
  id: string;
  label: string;
  href: string;
  platform: string;
};

export type ProjectMediaItem = {
  url: string;
  type: "image" | "video" | "embed";
  alt: string;
  caption: string;
};

export type Project = {
  slug: string;
  title: string;
  year: string;
  excerpt: string;
  description: string;
  responsibilities: string[];
  technologies: string[];
  visibility: "PUBLIC";
  featured: boolean;
  media: ProjectMediaItem[];
};

export type ExperienceItem = {
  id: string;
  slug: string;
  company: string;
  role: string;
  location: string;
  summary: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  technologies: Array<{ id: string; name: string }>;
  projects: PublicProjectPreview[];
};

export type PublicProjectPreview = {
  slug: string;
  title: string;
  excerpt: string;
  year: string;
};

export type EducationItem = {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  description: string;
};

export type PublicSiteData = {
  name: string;
  title: string;
  description: string;
  email: string;
  aboutMarkdown: string;
  socialLinks: SocialLink[];
};

const defaultSiteData: PublicSiteData = {
  name: "Amiracle",
  title: "Portfolio",
  description: "",
  email: "",
  aboutMarkdown: "",
  socialLinks: [],
};

function logDataError(message: string, error: unknown) {
  console.error(
    message,
    error instanceof Error ? error.name : "Unknown error",
  );
}

export const getPublicSiteData = cache(async (): Promise<PublicSiteData> => {
  try {
    const [settings, links] = await Promise.all([
      prisma.siteSettings.findUnique({
        where: { id: SITE_SETTINGS_ID },
      }),
      prisma.socialLink.findMany({
        where: { isVisible: true },
        orderBy: { platform: "asc" },
      }),
    ]);

    return {
      name: settings?.siteName?.trim() || defaultSiteData.name,
      title: settings?.tagline?.trim() || defaultSiteData.title,
      description: settings?.description?.trim() || "",
      email: settings?.email?.trim() || "",
      aboutMarkdown: settings?.aboutMarkdown?.trim() || "",
      socialLinks: links.map((link) => ({
        id: link.id,
        platform: link.platform,
        label: link.label?.trim() || link.platform,
        href: link.url,
      })),
    };
  } catch (error) {
    logDataError("Unable to load public site settings and social links.", error);
    return defaultSiteData;
  }
});

export const getPublicTechnologies = cache(async () => {
  try {
    const rows = await prisma.technology.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    });

    return rows;
  } catch (error) {
    logDataError("Unable to load public technologies.", error);
    return [];
  }
});

function formatYear(date: Date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function toDateRange(startDate: Date, endDate: Date | null, isCurrent: boolean) {
  const start = formatDate(startDate);
  const end = isCurrent ? "Present" : endDate ? formatDate(endDate) : "";

  return { start, end };
}

export const getPublicEducation = cache(async (): Promise<EducationItem[]> => {
  try {
    const rows = await prisma.education.findMany({
      orderBy: [{ startDate: "desc" }, { school: "asc" }],
    });

    return rows.map((row) => ({
      id: row.id,
      school: row.school,
      degree: row.degree,
      field: row.field ?? "",
      startDate: formatDate(row.startDate),
      endDate: row.endDate ? formatDate(row.endDate) : "",
      description: row.description ?? "",
    }));
  } catch (error) {
    logDataError("Unable to load public education.", error);
    return [];
  }
});

function toProjectViewModel(project: {
  slug: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  responsibilities: string[];
  status: string;
  visibility: string;
  featured: boolean;
  publishedAt: Date | null;
  Technology: Array<{ name: string }>;
  ProjectMedia: Array<{
    url: string;
    type: "image" | "video" | "embed";
    alt: string | null;
    caption: string | null;
  }>;
}): Project {
  return {
    slug: project.slug,
    title: project.title,
    year: project.publishedAt ? formatYear(project.publishedAt) : "",
    excerpt: project.excerpt ?? "",
    description: project.description ?? "",
    responsibilities: project.responsibilities,
    technologies: project.Technology.map((technology) => technology.name),
    visibility: "PUBLIC",
    featured: project.featured,
    media: project.ProjectMedia.map((media) => ({
      url: media.url,
      type: media.type,
      alt: media.alt ?? "",
      caption: media.caption ?? "",
    })),
  };
}

const publicExperienceRelations = {
  Technology: {
    orderBy: { name: "asc" as const },
    select: { id: true, name: true },
  },
  Project: {
    where: { status: "published", visibility: "PUBLIC" },
    orderBy: [
      { featured: "desc" as const },
      { publishedAt: "desc" as const },
      { createdAt: "desc" as const },
    ],
    select: {
      slug: true,
      title: true,
      excerpt: true,
      publishedAt: true,
      status: true,
      visibility: true,
    },
  },
} satisfies Prisma.ExperienceInclude;

type PublicExperienceRecord = Prisma.ExperienceGetPayload<{
  include: typeof publicExperienceRelations;
}>;

function toExperienceViewModel(
  row: PublicExperienceRecord,
): ExperienceItem {
  const dates = toDateRange(row.startDate, row.endDate, row.isCurrent);

  return {
    id: row.id,
    slug: row.slug,
    company: row.company,
    role: row.role,
    location: row.location ?? "",
    summary: row.summary ?? "",
    startDate: dates.start,
    endDate: dates.end,
    isCurrent: row.isCurrent,
    description: row.description ?? "",
    technologies: row.Technology,
    projects: row.Project.filter(isPublicProject).map((project) => ({
      slug: project.slug,
      title: project.title,
      excerpt: project.excerpt ?? "",
      year: project.publishedAt ? formatYear(project.publishedAt) : "",
    })),
  };
}

async function findPublicExperiences(
  where: Prisma.ExperienceWhereInput = {},
): Promise<ExperienceItem[]> {
  const rows = await prisma.experience.findMany({
    where,
    orderBy: [{ startDate: "desc" }, { company: "asc" }],
    include: publicExperienceRelations,
  });

  return rows.map(toExperienceViewModel);
}

export const getPublicExperiences = cache(async (): Promise<ExperienceItem[]> => {
  try {
    return await findPublicExperiences();
  } catch (error) {
    logDataError("Unable to load public experience.", error);
    return [];
  }
});

export const getPublicExperienceBySlug = cache(
  async (slug: string): Promise<ExperienceItem | null> => {
    try {
      const [experience] = await findPublicExperiences({ slug });
      return experience ?? null;
    } catch (error) {
      logDataError("Unable to load the requested public experience.", error);
      return null;
    }
  },
);

const projectIncludes = {
  Technology: { orderBy: { name: "asc" as const } },
  ProjectMedia: { orderBy: { order: "asc" as const } },
};

export const getPublicProjects = cache(async (): Promise<Project[]> => {
  try {
    const rows = await prisma.project.findMany({
      where: { status: "published", visibility: "PUBLIC" },
      orderBy: [
        { featured: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      include: projectIncludes,
    });

    return rows.filter(isPublicProject).map(toProjectViewModel);
  } catch (error) {
    logDataError("Unable to load public projects.", error);
    return [];
  }
});

export const getProjectBySlug = cache(
  async (slug: string): Promise<Project | null> => {
    try {
      const project = await prisma.project.findFirst({
        where: { slug, status: "published", visibility: "PUBLIC" },
        include: projectIncludes,
      });

      return project && isPublicProject(project)
        ? toProjectViewModel(project)
        : null;
    } catch (error) {
      logDataError("Unable to load the requested public project.", error);
      return null;
    }
  },
);
