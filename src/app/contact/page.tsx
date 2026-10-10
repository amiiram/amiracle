import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { getPublicSiteUrl } from "@/lib/env";
import { getPublicSiteData } from "@/lib/portfolio-data";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getPublicSiteUrl();
  const canonical = siteUrl
    ? new URL("/contact", siteUrl).toString()
    : undefined;

  return {
    title: "Contact",
    description: "Contact information for the Amiracle portfolio.",
    ...(canonical
      ? {
          alternates: { canonical },
          openGraph: { url: canonical },
        }
      : {}),
  };
}

export default async function ContactPage() {
  const site = await getPublicSiteData();

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main-content" className="page-shell narrow-page">
        <section className="content-section">
          <SectionHeading
            label="Contact"
            title="Contact information"
            level={1}
          />
        </section>

        <section className="content-section contact-hero">
          <div>
            {site.email ? (
              <>
                <p>For inquiries, reach me by email.</p>
                <div className="contact-actions stack-actions">
                  <a
                    href={`mailto:${site.email}`}
                    className="primary-button"
                  >
                    {site.email}
                  </a>
                </div>
              </>
            ) : (
              <p>Contact information has not been added yet.</p>
            )}
          </div>

          {site.socialLinks.length > 0 ? (
            <div className="about-panel">
              <h2>Elsewhere</h2>
              <SocialLinks links={site.socialLinks} />
            </div>
          ) : null}
        </section>

        <section className="content-section">
          <Link href="/" className="secondary-button">
            Back to home
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
