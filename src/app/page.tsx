import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  getPublicProjects,
  getPublicSiteData,
  getPublicTechnologies,
} from "@/lib/portfolio-data";
import type { ProjectMediaItem } from "@/lib/portfolio-data";
import { canonicalUrl, jsonLdScript, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteData();
  const description =
    site.description || "A portfolio of projects, experience, and skills.";
  const base = pageMetadata({
    path: "/",
    title: `${site.title} | ${site.name}`,
    description,
  });

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      url: canonicalUrl("/"),
      title: site.title,
    },
  };
}

function ProjectCardBanner({
  media,
  title,
  eager = false,
}: {
  media: ProjectMediaItem;
  title: string;
  eager?: boolean;
}) {
  if (media.type === "image" && media.url) {
    return (
      <Image
        src={media.url}
        alt={media.alt || `${title} preview`}
        fill
        sizes="(max-width: 980px) 100vw, 520px"
        priority={eager}
        className="project-media-visual"
      />
    );
  }

  if (media.type === "video" && media.url) {
    return (
      <video
        src={media.url}
        muted
        playsInline
        preload="metadata"
        aria-label={media.alt || `${title} preview video`}
        className="project-media-visual"
      />
    );
  }

  return null;
}

export default async function HomePage() {
  const [projects, site, technologies] = await Promise.all([
    getPublicProjects(),
    getPublicSiteData(),
    getPublicTechnologies(),
  ]);

  const homeJsonLd = jsonLdScript({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${site.name} — ${site.title}`,
    description: site.description || undefined,
    url: canonicalUrl("/"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: projects.slice(0, 10).map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: canonicalUrl(`/projects/${encodeURIComponent(project.slug)}`),
        name: project.title,
      })),
    },
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: homeJsonLd }}
      />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main-content" className="page-shell">
        <section className="hero-panel">
          <div className="hero-main">
            <div className="hero-copy">
              <h1>{site.title}</h1>
              {site.description ? <p>{site.description}</p> : null}

              <div className="hero-actions">
                <Link href="#work" className="primary-button">
                  View my work
                </Link>
                <Link href="/contact" className="secondary-button">
                  Get in touch
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="work" className="content-section">
          <SectionHeading label="Work" title="Selected projects" />

          {projects.length > 0 ? (
            <div className="project-list">
              {projects.map((project, index) => {
                const banner = project.media[0];

                return (
                  <article
                    key={project.slug}
                    className={`project-card project-card-${index + 1}${
                      banner ? "" : " project-card-no-media"
                    }`}
                  >
                    {banner ? (
                      <div className="project-visual">
                        <ProjectCardBanner media={banner} title={project.title} eager={index === 0} />
                      </div>
                    ) : null}

                    <div className="project-content">
                      <div className="project-header-line">
                        <h3>{project.title}</h3>
                        {project.year ? (
                          <span className="project-year">
                            {`// ${project.year}`}
                          </span>
                        ) : null}
                      </div>

                      {project.excerpt ? <p>{project.excerpt}</p> : null}

                      {project.technologies.length > 0 ? (
                        <ul
                          className="tech-tags"
                          aria-label={`${project.title} technologies`}
                        >
                          {project.technologies.map((technology) => (
                            <li key={technology}>{technology}</li>
                          ))}
                        </ul>
                      ) : null}

                      <Link
                        href={`/projects/${project.slug}`}
                        className="inline-link"
                      >
                        View case study
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p>No public projects have been added yet.</p>
          )}
        </section>

        <section className="content-section about-preview">
          <div className="about-card">
            <div className="about-text">
              <div className="eyebrow">
                <span className="eyebrow-slash">{`//`}</span>
                <span>About</span>
              </div>
              <h2>About {site.name}</h2>
              <p>
                Browse the experience and skills listed on the About page.
              </p>
              <Link href="/about" className="inline-link">
                About
              </Link>
            </div>

            <div className="tech-stack-panel">
              <div className="tech-headline">Skills</div>
              {technologies.length > 0 ? (
                <ul className="stack-list">
                  {technologies.map((technology) => (
                    <li key={technology.id}>{technology.name}</li>
                  ))}
                </ul>
              ) : (
                <p>No skills have been added yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
