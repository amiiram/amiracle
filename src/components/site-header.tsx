import Link from "next/link";

import { siteSettings } from "@/lib/portfolio-data";

export function SiteHeader() {
  return (
    <header className="site-shell">
      <div className="site-header">
        <Link href="/" className="brand" aria-label="Amiracle home">
          <span className="brand-mark">✦</span>
          <span>{siteSettings.name}</span>
        </Link>

        <nav aria-label="Main navigation" className="nav">
          {siteSettings.navItems.map((item) => (
            <Link key={item.label} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
