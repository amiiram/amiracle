import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import {
  notes,
  publicProjects,
  siteSettings,
  technologies,
} from "@/lib/portfolio-data";

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="page-shell">
        <section className="hero-panel">
          <div className="hero-top-row">
            <div className="status-pill">
              <span className="status-dot" aria-hidden="true" />
              <span>{siteSettings.statusLabel}</span>
            </div>

            <div className="micro-tag">
              <span>{`[EST. 1998 // DEV_PORTAL]`}</span>
              <span className="small-dot" aria-hidden="true" />
            </div>
          </div>

          <div className="hero-main">
            <div className="hero-copy">
              <h1>{siteSettings.title}</h1>
              <p>{siteSettings.description}</p>

              <div className="hero-actions">
                <Link href="#work" className="primary-button">
                  View my work
                </Link>
                <Link href="/contact" className="secondary-button">
                  Get in touch
                </Link>
              </div>
            </div>

            <div className="terminal-card" aria-label="Developer status panel">
              <div className="terminal-header">
                <span>~ amir.sh --workspace</span>
                <span className="terminal-dots" aria-hidden="true">
                  <i />
                  <i />
                </span>
              </div>

              <div className="terminal-body">
                <div className="terminal-row">
                  <span>SYSTEM</span>
                  <span>READY</span>
                </div>
                <div className="terminal-row">
                  <span>BUILD</span>
                  <span>0.8.4</span>
                </div>
                <div className="terminal-row">
                  <span>LATENCY</span>
                  <span>12ms</span>
                </div>
                <div className="terminal-row">
                  <span>STATUS</span>
                  <span>BUILDING</span>
                </div>
              </div>

              <div className="progress-block" aria-hidden="true">
                <div className="progress-track">
                  <span className="progress-fill" />
                </div>
              </div>

              <div className="status-line">
                <span className="line-star">✦</span>
                <span>System ready. Always compiling.</span>
              </div>
            </div>
          </div>
        </section>

        <section id="work" className="content-section">
          <SectionHeading
            label="Selected Work"
            title="Software built with extreme intent"
          />

          <div className="project-list">
            {publicProjects.map((project, index) => (
              <article
                key={project.slug}
                className={`project-card project-card-${index + 1}`}
              >
                <div className="project-visual" aria-hidden="true">
                  <div className="visual-panel" />
                </div>

                <div className="project-content">
                  <div className="project-header-line">
                    <h3>{project.title}</h3>
                    <span className="project-year">{`// ${project.year}`}</span>
                  </div>

                  <p>{project.excerpt}</p>

                  <ul
                    className="tech-tags"
                    aria-label={`${project.title} technologies`}
                  >
                    {project.technologies.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>

                  <Link
                    href={`/projects/${project.slug}`}
                    className="inline-link"
                  >
                    View case study
                  </Link>
                </div>
              </article>
            ))}

            <article className="project-card project-card-private">
              <div className="project-visual" aria-hidden="true">
                <div className="visual-panel" />
              </div>

              <div className="project-content">
                <div className="project-header-line">
                  <h3>Product / Platform</h3>
                  <span className="private-chip">Private Project</span>
                </div>

                <p>
                  A private platform for creators. Built end-to-end. Details are
                  intentionally restricted.
                </p>

                <ul
                  className="tech-tags"
                  aria-label="Private project technologies"
                >
                  <li>Full-stack</li>
                  <li>Next.js</li>
                  <li>PostgreSQL</li>
                </ul>

                <Link href="/contact" className="inline-link">
                  Inquire for details
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section id="notes" className="content-section notes-section">
          <SectionHeading
            label="Notes"
            title="Raw thoughts on engineering, interface design, & internet products"
          />

          <div className="note-list">
            {notes.map((note) => (
              <article key={note.title} className="note-item">
                <div className="note-meta">
                  <time>{note.publishedAt}</time>
                  <span>{note.readingTime}</span>
                </div>

                <div className="note-copy">
                  <h3>{note.title}</h3>
                  <p>{note.excerpt}</p>
                </div>

                <div className="note-badge-wrap">
                  <span className="note-badge">{note.category}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section now-section">
          <SectionHeading
            label="Now"
            title="What I’m focused on at this moment"
          />

          <div className="now-card">
            <div className="live-feed">
              <span>{`// LIVE FEED`}</span>
            </div>

            <div className="now-grid">
              <div className="now-item">
                <span className="now-label">BUILDING</span>
                <strong>Portfolio + product systems</strong>
              </div>
              <div className="now-item">
                <span className="now-label">EXPLORING</span>
                <strong>Next.js architecture and product UX</strong>
              </div>
              <div className="now-item">
                <span className="now-label">FOCUS</span>
                <strong>
                  Frontend polish, backend depth, and deployment clarity
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section about-preview">
          <div className="about-card">
            <div className="about-text">
              <div className="eyebrow">
                <span className="eyebrow-slash">{`//`}</span>
                <span>About</span>
              </div>
              <h2>
                Developer, frontend-first, with a serious interest in product
                systems.
              </h2>
              <p>
                I build product experiences that balance craft, performance, and
                real-world implementation. I care about interfaces that feel
                considered, systems that keep working, and shipping software
                people can trust.
              </p>
              <Link href="/about" className="inline-link">
                More about me
              </Link>
            </div>

            <div className="tech-stack-panel">
              <div className="tech-headline">Core stack</div>
              <ul className="stack-list">
                {technologies.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">amiracle</div>
          <SocialLinks />
        </div>
      </footer>
    </>
  );
}
