import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { getPublicSiteData } from "@/lib/portfolio-data";
import { canonicalUrl, jsonLdScript, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteData();
  return pageMetadata({
    path: "/contact",
    title: "Contact",
    description: "Contact Amiracle about opportunities, projects, or questions.",
    locale: site.locale,
  });
}

export default async function ContactPage() {
  const site = await getPublicSiteData();
  const socialLinks = site.socialLinks.filter(
    (link) => !site.email || !link.href.toLowerCase().startsWith("mailto:"),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            url: canonicalUrl("/contact"),
            name: `Contact ${site.name}`,
          }),
        }}
      />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main-content" className="page-shell narrow-page">
        <section className="content-section contact-page-section">
          <SectionHeading label="Contact" title="Let’s get in touch" level={1} />
          <div className="contact-page-hero">
            <div
              className={`contact-page-copy${
                socialLinks.length === 0 ? " contact-page-copy-full" : ""
              }`}
            >
              <div className="eyebrow">
                <span className="eyebrow-slash">{`//`}</span>
                <span>Start a conversation</span>
              </div>
              <h2>Have an opportunity, a project, or a question?</h2>
              <p>
                {site.email && socialLinks.length > 0
                  ? "Send me an email or connect through one of the profiles. I’d be glad to hear from you."
                  : site.email
                    ? "Send me an email. I’d be glad to hear from you."
                    : socialLinks.length > 0
                      ? "Connect with me through one of the profiles below."
                      : "Contact details have not been added yet."}
              </p>
              {site.email ? (
                <a
                  href={`mailto:${site.email}`}
                  className="contact-email-link"
                >
                  <span className="contact-option-label">Email</span>
                  <span className="contact-email-address">{site.email}</span>
                  <span className="contact-email-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ) : null}
            </div>

            {socialLinks.length > 0 ? (
              <aside className="contact-social-panel">
                <h2>Find me elsewhere</h2>
                <p>Connect with me on these profiles.</p>
                <SocialLinks
                  links={socialLinks}
                  className="social-list contact-social-list"
                />
              </aside>
            ) : null}
          </div>
        </section>

        <section className="contact-page-footer">
          <p>Thanks for stopping by.</p>
          <Link href="/" className="inline-link">
            Back to home
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
