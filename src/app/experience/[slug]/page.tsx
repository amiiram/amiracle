import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicExperienceBySlug, getPublicExperiences } from "@/lib/portfolio-data";
import { renderMarkdown } from "@/lib/markdown";
import { canonicalUrl, jsonLdScript, pageMetadata } from "@/lib/seo";

type ExperiencePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const experiences = await getPublicExperiences();
  return experiences.map((experience) => ({ slug: experience.slug }));
}

function experienceDescription(summary: string, role: string, company: string) {
  return summary || `${role} at ${company}. Professional experience.`;
}

export async function generateMetadata({
  params,
}: ExperiencePageProps): Promise<Metadata> {
  const { slug } = await params;
  const experience = await getPublicExperienceBySlug(slug);

  if (!experience) {
    return {
      title: "Experience not found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${experience.role} at ${experience.company}`;
  const description = experienceDescription(
    experience.summary,
    experience.role,
    experience.company,
  );

  return {
    ...pageMetadata({
      path: `/experience/${encodeURIComponent(experience.slug)}`,
      title,
      description,
      ogType: "article",
    }),
  };
}

export default async function ExperienceDetailPage({
  params,
}: ExperiencePageProps) {
  const { slug } = await params;
  const experience = await getPublicExperienceBySlug(slug);

  if (!experience) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${experience.role} at ${experience.company}`,
            description: experience.summary || undefined,
            url: canonicalUrl(`/experience/${encodeURIComponent(experience.slug)}`),
            dateModified: experience.updatedAt.toISOString(),
            author: { "@type": "Person", name: experience.company },
          }),
        }}
      />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main-content" className="page-shell narrow-page">
        <article>
          <section className="content-section">
            <SectionHeading
              label="Experience"
              title={experience.role}
              level={1}
            />
            <p className="company-line">
              {experience.company}
              {experience.location ? ` · ${experience.location}` : ""}
            </p>
            <p className="mt-3 text-sm text-[var(--accent)]">
              {experience.startDate}
              {experience.isCurrent
                ? " – Present"
                : experience.endDate
                  ? ` – ${experience.endDate}`
                  : ""}
            </p>
            {experience.isCurrent ? (
              <p className="mt-3 inline-flex rounded-none border border-[var(--accent)]/40 px-3 py-1 text-xs text-[var(--accent)]">
                Current role
              </p>
            ) : null}
            {experience.summary ? (
              <p className="mt-6 text-lg leading-8 text-[var(--am-text)]">
                {experience.summary}
              </p>
            ) : null}
          </section>

          {experience.description ? (
            <section
              className="content-section"
              aria-label="Role description"
            >
              <div className="markdown-body">
                {renderMarkdown(experience.description, {
                  headingOffset: 1,
                  lineBreaks: true,
                })}
              </div>
            </section>
          ) : null}

          {experience.technologies.length > 0 ? (
            <section className="content-section">
              <SectionHeading label="Skills" title="Technologies and skills" />
              <ul className="stack-grid">
                {experience.technologies.map((technology) => (
                  <li key={technology.id} className="stack-pill">
                    {technology.name}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {experience.projects.length > 0 ? (
            <section className="content-section">
              <SectionHeading label="Work" title="Related projects" />
              <div className="grid gap-4 sm:grid-cols-2">
                {experience.projects.map((project) => (
                  <article
                    key={project.slug}
                    className="experience-project-card p-5"
                  >
                    {project.year ? (
                      <p className="text-xs text-[var(--accent)]">{project.year}</p>
                    ) : null}
                    <h3 className="mt-2 text-lg font-medium text-[var(--am-text)]">
                      <Link
                        href={`/projects/${encodeURIComponent(project.slug)}`}
                        className="underline decoration-[var(--am-border)] underline-offset-4 transition hover:text-[var(--am-link)] hover:decoration-[var(--am-link)]"
                      >
                        {project.title}
                      </Link>
                    </h3>
                    {project.excerpt ? (
                      <p className="mt-2 text-sm leading-6 text-[var(--am-text-muted)]">
                        {project.excerpt}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="content-section">
            <Link href="/experience" className="secondary-button">
              Back to experience
            </Link>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
