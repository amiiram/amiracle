import Link from "next/link";
import type { Metadata } from "next";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { renderMarkdown } from "@/lib/markdown";
import { getPublicSiteUrl } from "@/lib/env";
import {
  getPublicEducation,
  getPublicExperiences,
  getPublicSiteData,
  getPublicTechnologies,
} from "@/lib/portfolio-data";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getPublicSiteUrl();
  const canonical = siteUrl ? new URL("/about", siteUrl).toString() : undefined;

  return {
    title: "About",
    description: "About information for the Amiracle portfolio.",
    ...(canonical
      ? {
          alternates: { canonical },
          openGraph: { url: canonical },
        }
      : {}),
  };
}

export default async function AboutPage() {
  const [site, experiences, education, technologies] = await Promise.all([
    getPublicSiteData(),
    getPublicExperiences(),
    getPublicEducation(),
    getPublicTechnologies(),
  ]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main-content" className="page-shell narrow-page">
        <section className="content-section">
          <SectionHeading label="About" title={`About ${site.name}`} level={1} />
        </section>

        <section className="content-section">
          {site.aboutMarkdown ? (
            <div className="markdown-body">
              {renderMarkdown(site.aboutMarkdown)}
            </div>
          ) : (
            <p>About details have not been added yet.</p>
          )}
        </section>

        {experiences.length > 0 ? (
          <section className="content-section">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading label="Experience" title="Experience" />
              <Link
                href="/experience"
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-200 underline decoration-neutral-600 underline-offset-4 transition hover:text-white hover:decoration-lime-300"
              >
                View all experience
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="timeline">
              {experiences.slice(0, 3).map((experience) => (
                <article key={experience.id} className="timeline-item">
                  <div className="timeline-meta">
                    <span>{experience.startDate}</span>
                    {experience.endDate ? (
                      <span>{experience.endDate}</span>
                    ) : experience.isCurrent ? (
                      <span>Present</span>
                    ) : null}
                  </div>
                  <div className="timeline-body">
                    <h3>{experience.role}</h3>
                    <p className="company-line">
                      {experience.company}
                      {experience.location ? ` · ${experience.location}` : ""}
                    </p>
                    {experience.summary ? (
                      <p>{experience.summary}</p>
                    ) : null}
                    <Link
                      href={`/experience/${encodeURIComponent(experience.slug)}`}
                      className="mt-3 inline-flex text-sm text-zinc-200 underline decoration-neutral-600 underline-offset-4 transition hover:text-white hover:decoration-lime-300"
                    >
                      Role details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {education.length > 0 ? (
          <section className="content-section">
            <SectionHeading label="Education" title="Education" />
            <div className="timeline">
              {education.map((item) => (
                <article key={item.id} className="timeline-item">
                  <div className="timeline-meta">
                    <span>{item.startDate}</span>
                    {item.endDate ? <span>{item.endDate}</span> : null}
                  </div>
                  <div className="timeline-body">
                    <h3>{item.degree}</h3>
                    <p className="company-line">
                      {item.school}
                      {item.field ? ` · ${item.field}` : ""}
                    </p>
                    {item.description ? <p>{item.description}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="content-section">
          <SectionHeading label="Skills" title="Skills and technologies" />
          {technologies.length > 0 ? (
            <div className="stack-grid">
              {technologies.map((technology) => (
                <span key={technology.id} className="stack-pill">
                  {technology.name}
                </span>
              ))}
            </div>
          ) : (
            <p>No skills have been added yet.</p>
          )}
        </section>

        <section className="content-section contact-panel">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-slash">{`//`}</span>
              <span>Contact</span>
            </div>
            <h2>Contact information</h2>
          </div>

          <div className="contact-actions">
            <Link href="/contact" className="primary-button">
              Contact
            </Link>
            <SocialLinks links={site.socialLinks} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
