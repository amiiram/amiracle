import Image from "next/image";
import Link from "next/link";

import { SocialLinks } from "@/components/social-links";
import { getPublicSiteData } from "@/lib/portfolio-data";

export async function SiteFooter() {
  const { name, socialLinks } = await getPublicSiteData();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link
          href="/"
          className="footer-brand"
          aria-label={`${name} home`}
        >
          <Image
            src="/brand/amiracle-wordmark-small-dark.svg"
            alt=""
            width={501}
            height={104}
            className="brand-wordmark brand-wordmark-dark"
          />
          <Image
            src="/brand/amiracle-wordmark-small-light.svg"
            alt=""
            width={501}
            height={104}
            className="brand-wordmark brand-wordmark-light"
          />
        </Link>
        <SocialLinks links={socialLinks} />
      </div>
    </footer>
  );
}
