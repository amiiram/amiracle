import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { siteSettings } from "@/lib/portfolio-data";

export default function ContactPage() {
  return (
    <>
      <SiteHeader />

      <main className="page-shell narrow-page">
        <section className="content-section">
          <SectionHeading
            label="Contact"
            title="Let’s build something useful."
          />
        </section>

        <section className="content-section contact-hero">
          <div>
            <p>
              I’m open to frontend, full-stack, and product-focused
              opportunities where strong engineering and thoughtful design
              matter.
            </p>
            <div className="contact-actions stack-actions">
              <a href="mailto:hello@amiracle.dev" className="primary-button">
                hello@amiracle.dev
              </a>
              <Link href="/about" className="secondary-button">
                Back to about
              </Link>
            </div>
          </div>

          <div className="about-panel">
            <h3>Current focus</h3>
            <ul>
              <li>Frontend architecture and product interfaces</li>
              <li>Full-stack product implementation</li>
              <li>Systems that scale without sacrificing clarity</li>
            </ul>
          </div>
        </section>

        <section className="content-section social-section">
          <div className="eyebrow">
            <span className="eyebrow-slash">{`//`}</span>
            <span>Elsewhere</span>
          </div>
          <SocialLinks />
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
