import { SocialLinks } from "@/components/social-links";
import { getPublicSiteData } from "@/lib/portfolio-data";

export async function SiteFooter() {
  const { name, socialLinks } = await getPublicSiteData();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">{name}</div>
        <SocialLinks links={socialLinks} />
      </div>
    </footer>
  );
}
