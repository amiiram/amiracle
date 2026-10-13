import Image from "next/image";
import Link from "next/link";

import { SiteNavigation } from "@/components/site-navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPublicSiteData } from "@/lib/portfolio-data";

export async function SiteHeader() {
  const { name } = await getPublicSiteData();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label={`${name} home`}>
          <Image
            src="/brand/amiracle-wordmark-display-dark.svg"
            alt=""
            width={493}
            height={104}
            className="brand-wordmark brand-wordmark-display-dark"
          />
          <Image
            src="/brand/amiracle-wordmark-display-light.svg"
            alt=""
            width={493}
            height={104}
            className="brand-wordmark brand-wordmark-display-light"
          />
          <Image
            src="/brand/amiracle-wordmark-small-dark.svg"
            alt=""
            width={501}
            height={104}
            className="brand-wordmark brand-wordmark-small-dark"
          />
          <Image
            src="/brand/amiracle-wordmark-small-light.svg"
            alt=""
            width={501}
            height={104}
            className="brand-wordmark brand-wordmark-small-light"
          />
        </Link>

        <div className="header-tools">
          <SiteNavigation />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
