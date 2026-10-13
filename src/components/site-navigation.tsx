"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    label: "Work",
    href: "/#work",
    matches: (pathname: string) =>
      pathname === "/" || pathname.startsWith("/projects/"),
  },
  {
    label: "About",
    href: "/about",
    matches: (pathname: string) => pathname === "/about",
  },
  {
    label: "Experience",
    href: "/experience",
    matches: (pathname: string) => pathname.startsWith("/experience"),
  },
  {
    label: "Contact",
    href: "/contact",
    matches: (pathname: string) => pathname === "/contact",
  },
];

export function SiteNavigation() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Main navigation"
      className="nav site-navigation"
    >
      {navigationItems.map((item) => {
        const isActive = item.matches(pathname);

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className="nav-link"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
