import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicSiteUrl } from "@/lib/env";
import { getPublicExperiences } from "@/lib/portfolio-data";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getPublicSiteUrl();
  const canonical = siteUrl
    ? new URL("/experience", siteUrl).toString()
    : undefined;

  return {
    title: "Experience",
    description: "Professional experience and roles.",
    ...(canonical
      ? {
          alternates: { canonical },
          openGraph: { url: canonical },
        }
      : {}),
  };
}

export default async function ExperiencePage() {
  const experiences = await getPublicExperiences();

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main-content" className="page-shell narrow-page">
        <section className="content-section">
          <SectionHeading
            label="Experience"
            title="Professional experience"
            level={1}
          />
        </section>

        <section className="content-section" aria-label="Work history">
          {experiences.length > 0 ? (
            <div className="timeline">
              {experiences.map((experience) => (
                <article key={experience.id} className="timeline-item">
                  <div className="timeline-meta">
                    <span>
                      {experience.startDate}
                      {experience.isCurrent
                        ? " – Present"
                        : experience.endDate
                          ? ` – ${experience.endDate}`
                          : ""}
                    </span>
                  </div>
                  <div className="timeline-body">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2>{experience.role}</h2>
                      {experience.isCurrent ? (
                        <span className="rounded-full border border-lime-300/40 px-2 py-0.5 text-xs text-lime-200">
                          Current
                        </span>
                      ) : null}
                    </div>
                    <p className="company-line">
                      {experience.company}
                      {experience.location ? ` · ${experience.location}` : ""}
                    </p>
                    {experience.summary ? (
                      <p className="whitespace-pre-wrap">{experience.summary}</p>
                    ) : null}

                    {experience.technologies.length > 0 ? (
                      <ul
                        className="mt-4 flex flex-wrap gap-2"
                        aria-label={`Technologies for ${experience.role}`}
                      >
                        {experience.technologies.map((technology) => (
                          <li
                            key={technology.id}
                            className="stack-pill"
                          >
                            {technology.name}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {experience.projects.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                          Related projects
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                          {experience.projects.slice(0, 2).map((project) => (
                            <li key={project.slug}>
                              <Link
                                href={`/projects/${encodeURIComponent(project.slug)}`}
                                className="text-sm text-zinc-200 underline decoration-neutral-600 underline-offset-4 transition hover:decoration-lime-300"
                              >
                                {project.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <Link
                      href={`/experience/${encodeURIComponent(experience.slug)}`}
                      className="mt-4 inline-flex text-sm text-lime-200 underline decoration-lime-200/40 underline-offset-4 transition hover:decoration-lime-200"
                    >
                      Read role details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>Experience details have not been added yet.</p>
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
