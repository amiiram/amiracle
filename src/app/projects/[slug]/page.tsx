import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { getProjectBySlug, siteSettings } from "@/lib/portfolio-data";

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

          <div className="project-feature-visual" aria-hidden="true">
            <div className="feature-visual-panel" />
          </div>
        </section>

        <section className="content-section project-detail-layout">
          <div className="project-story">
            <p>{project.excerpt}</p>
            <p>{project.description}</p>
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
