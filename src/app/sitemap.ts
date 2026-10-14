import type { MetadataRoute } from "next";

import { getPublicSiteUrl } from "@/lib/env";
import {
  getPublicExperiences,
  getPublicProjects,
} from "@/lib/portfolio-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getPublicSiteUrl();

  if (!siteUrl) {
    return [];
  }

  const [projects, experiences] = await Promise.all([
    getPublicProjects(),
    getPublicExperiences(),
  ]);
  const toUrl = (path: string) => new URL(path, siteUrl).toString();

  return [
    { url: toUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: toUrl("/about"), changeFrequency: "monthly", priority: 0.8 },
    { url: toUrl("/contact"), changeFrequency: "yearly", priority: 0.5 },
    { url: toUrl("/experience"), changeFrequency: "monthly", priority: 0.8 },
    ...projects.map((project) => ({
      url: toUrl(`/projects/${encodeURIComponent(project.slug)}`),
      lastModified: project.publishedAt ?? project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...experiences.map((experience) => ({
      url: toUrl(`/experience/${encodeURIComponent(experience.slug)}`),
      lastModified: experience.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
