import type { SocialLink } from "@/lib/portfolio-data";

export function SocialLinks({ links }: { links: SocialLink[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <ul className="social-list" aria-label="Social profiles">
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={link.href}
            target={link.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
            className="social-link"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
