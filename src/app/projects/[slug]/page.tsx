import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { getProjectBySlug, siteSettings } from "@/lib/portfolio-data";
import { renderMarkdown } from "@/lib/markdown";
import type { ProjectMediaItem } from "@/lib/portfolio-data";

/**
 * Renders one media item in the visual language of the project page. The
 * banner lives inside the existing `project-feature-visual` frame and gallery
 * items are wrapped as figures with their caption.
 */
function ProjectMediaContent({
  media,
  preload = false,
}: {
  media: ProjectMediaItem;
  preload?: boolean;
}) {
  if (media.type === "image" && media.url) {
    return (
      <Image
        src={media.url}
        alt={media.alt || "Project media"}
        fill
        preload={preload}
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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // The first ordered media item is the banner/cover; the rest forms a gallery.
  const [banner, ...galleryMedia] = project.media;

  return (
    <>
      <SiteHeader />

      <main className="page-shell narrow-page">
        <section className="content-section project-detail-hero">
          <div className="project-detail-header">
            <div className="eyebrow">
              <span className="eyebrow-slash">{`//`}</span>
              <span>{project.year}</span>
            </div>
            <h1>{project.title}</h1>
          </div>

          <div
            className="project-feature-visual"
            aria-hidden={banner ? undefined : true}
          >
            {banner ? (
              <ProjectMediaContent media={banner} preload />
            ) : (
              <div className="feature-visual-panel" />
            )}
          </div>
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

          <aside className="project-aside">
            <div className="aside-block">
              <h3>Stack</h3>
              <ul>
                {project.technologies.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </div>

            <div className="aside-block">
              <h3>Responsibilities</h3>
              <ul>
                {project.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>
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

        <section className="content-section">
          <SectionHeading
            label="Project notes"
            title="What this work was trying to solve"
          />
          <div className="project-notes">
            <p>
              The project focus was not simply “build a UI,” but create a
              dependable experience where timing, reliability, and product
              clarity mattered more than cleverness alone.
            </p>
            <p>
              In practice, that meant balancing technical constraints with
              usability: better playback behavior, stronger states, cleaner
              operational feedback, and a system that could be reasoned about
              under real pressure.
            </p>
          </div>
        </section>

        <section className="content-section project-footer-nav">
          <Link href="/#work" className="secondary-button">
            Back to work
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">{siteSettings.name}</div>
          <SocialLinks />
        </div>
      </footer>
    </>
  );
}
