import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getProjectBySlug, getPublicProjects, getPublicSiteData } from "@/lib/portfolio-data";
import { renderMarkdown } from "@/lib/markdown";
import type { ProjectMediaItem } from "@/lib/portfolio-data";
import { canonicalUrl, jsonLdScript, pageMetadata } from "@/lib/seo";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const projects = await getPublicProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [project, site] = await Promise.all([
    getProjectBySlug(slug),
    getPublicSiteData(),
  ]);

  if (!project) {
    return {
      title: "Project not found",
      robots: { index: false, follow: false },
    };
  }

  const description = project.excerpt || `${project.title} project case study.`;

  return {
    ...pageMetadata({
      path: `/projects/${encodeURIComponent(slug)}`,
      title: project.title,
      description,
      ogType: "article",
      locale: site.locale,
    }),
  };
}

/**
 * Renders one media item in the visual language of the project page. The
 * banner lives inside the existing `project-feature-visual` frame and gallery
 * items are wrapped as figures with their caption.
 */
function ProjectMediaContent({
  media,
  eager = false,
}: {
  media: ProjectMediaItem;
  eager?: boolean;
}) {
  if (media.type === "image" && media.url) {
    return (
      <Image
        src={media.url}
        alt={media.alt || "Project media"}
        fill
        priority={eager}
        sizes="(max-width: 980px) 100vw, 1120px"
        className="project-media-visual"
      />
    );
  }

  if (media.type === "video" && media.url) {
    return (
      <video
        src={media.url}
        controls
        preload="metadata"
        aria-label={media.alt || "Project video"}
        className="project-media-visual"
      />
    );
  }

  if (media.url) {
    return (
      <a
        href={media.url}
        rel="noreferrer"
        className="project-embed-panel"
        aria-label={media.alt || "Open embedded content"}
      >
        <span className="project-embed-label">Embedded content</span>
        <span className="project-embed-url">{media.url}</span>
      </a>
    );
  }

  return null;
}

export default async function ProjectDetailPage({
  params,
}: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // The first ordered media item is the banner/cover; the rest forms a gallery.
  const [banner, ...galleryMedia] = project.media;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: project.title,
            description: project.excerpt || undefined,
            url: canonicalUrl(`/projects/${encodeURIComponent(project.slug)}`),
            image: project.media
              .filter((item) => item.type === "image")
              .slice(0, 3)
              .map((item) => canonicalUrl(item.url) ?? item.url),
            datePublished: project.publishedAt ?? undefined,
            dateModified: project.updatedAt,
          }),
        }}
      />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main-content" className="page-shell narrow-page">
        <section className="content-section project-detail-hero">
          <div className="project-detail-header">
            <div className="eyebrow">
              <span className="eyebrow-slash">{`//`}</span>
              <span>{project.year}</span>
            </div>
            <h1>{project.title}</h1>
          </div>

          {banner ? (
            <div className="project-feature-visual">
              <ProjectMediaContent media={banner} eager />
            </div>
          ) : null}
        </section>

        <section className="content-section project-detail-layout">
          <div className="project-story">
            {project.excerpt ? <p>{project.excerpt}</p> : null}
            {project.description ? (
              <div className="markdown-body">
                {renderMarkdown(project.description)}
              </div>
            ) : null}
          </div>

          {project.technologies.length > 0 ||
          project.responsibilities.length > 0 ? (
            <aside className="project-aside">
              {project.technologies.length > 0 ? (
                <div className="aside-block">
                  <h2>Stack</h2>
                  <ul>
                    {project.technologies.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {project.responsibilities.length > 0 ? (
                <div className="aside-block">
                  <h2>Responsibilities</h2>
                  <ul>
                    {project.responsibilities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
          ) : null}
        </section>

        {galleryMedia.length > 0 ? (
          <section className="content-section" aria-label="Project media">
            <SectionHeading
              label="Project media"
              title="Visuals from this build"
            />
            <div className="project-gallery">
              {galleryMedia.map((media, index) => (
                <figure
                  key={`${media.url}-${index}`}
                  className="project-gallery-item"
                >
                  <div className="project-gallery-media">
                    <ProjectMediaContent media={media} />
                  </div>
                  {media.caption ? (
                    <figcaption>{media.caption}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className="content-section project-footer-nav">
          <Link href="/#work" className="secondary-button">
            Back to work
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
