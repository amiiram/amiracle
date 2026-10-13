import type { SocialLink } from "@/lib/portfolio-data";

export function SocialLinks({
  links,
  className = "social-list",
}: {
  links: SocialLink[];
  className?: string;
}) {
  if (links.length === 0) {
    return null;
  }

  return (
    <ul className={className} aria-label="Social profiles">
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
