import { socialLinks } from "@/lib/portfolio-data";

export function SocialLinks() {
  return (
    <ul className="social-list" aria-label="Social profiles">
      {socialLinks.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="social-link"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
