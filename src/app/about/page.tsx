import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { renderMarkdown } from "@/lib/markdown";
import {
  experiences,
  getAboutMarkdown,
  siteSettings,
  technologies,
} from "@/lib/portfolio-data";

export default async function AboutPage() {
  // Authored in the admin Markdown editor; empty until something is saved.
  const aboutMarkdown = await getAboutMarkdown();

  return (
    <>
      <SiteHeader />

      <main className="page-shell narrow-page">
        <section className="content-section">
          <SectionHeading
            label="About"
            title="I build product experiences with clear systems and sharp execution."
          />
        </section>

        <section className="content-section about-layout">
          <div className="about-column">
            <p>
              I’m a developer who cares about the full product: interface
              quality, technical clarity, and the systems that make an idea
              actually work in the real world. My focus is frontend-first, but
              I’m comfortable working across the stack when the product needs
              it.
            </p>
            <p>
              I enjoy turning rough ideas into polished, dependable software.
              That means thoughtful UX, clear patterns, intentionally designed
              interfaces, and technical decisions that hold up under real use.
            </p>
          </div>

          <div className="about-panel">
            <h3>Core strengths</h3>
            <ul>
              <li>Frontend architecture and product interfaces</li>
              <li>React / Next.js product implementation</li>
              <li>Full-stack systems and databases</li>
              <li>Design-aware engineering and product thinking</li>
            </ul>
          </div>
        </section>

        {/* Long-form narrative saved from the admin Markdown editor. It uses the
            same renderer as project pages, and is skipped entirely while empty. */}
        {aboutMarkdown ? (
          <section className="content-section">
            <div className="markdown-body">{renderMarkdown(aboutMarkdown)}</div>
          </section>
        ) : null}

        <section className="content-section">
          <SectionHeading
            label="Experience"
            title="Product-minded engineering across frontend and full-stack work"
          />

          <div className="timeline">
            {experiences.map((experience) => (
              <article
                key={`${experience.company}-${experience.role}`}
                className="timeline-item"
              >
                <div className="timeline-meta">
                  <span>{experience.startDate}</span>
                  <span>
                    {experience.isCurrent ? "Present" : experience.endDate}
                  </span>
                </div>
                <div className="timeline-body">
                  <h3>{experience.role}</h3>
                  <p className="company-line">{experience.company}</p>
                  <p>{experience.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section">
          <SectionHeading label="Stack" title="Technologies I work with" />
          <div className="stack-grid">
            {technologies.map((technology) => (
              <span key={technology} className="stack-pill">
                {technology}
              </span>
            ))}
          </div>
        </section>

        <section className="content-section contact-panel">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-slash">{`//`}</span>
              <span>Contact</span>
            </div>
            <h2>Open to product, frontend, and full-stack roles.</h2>
          </div>

          <div className="contact-actions">
            <Link href="/contact" className="primary-button">
              Get in touch
            </Link>
            <SocialLinks />
          </div>
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
