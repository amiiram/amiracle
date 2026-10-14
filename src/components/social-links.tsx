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
      {links.map((link) => {
        const isMailto = link.href.toLowerCase().startsWith("mailto:");

        return (
          <li key={link.id}>
            <a
              href={link.href}
              target={isMailto ? undefined : "_blank"}
              rel={isMailto ? undefined : "noreferrer noopener me"}
              className="social-link"
            >
              {link.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
