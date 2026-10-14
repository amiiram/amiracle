import type { Metadata, Viewport } from "next";
import { DM_Mono, Instrument_Sans } from "next/font/google";
import Script from "next/script";
import { getPublicSiteData } from "@/lib/portfolio-data";
import { getPublicSiteUrl } from "@/lib/env";
import { SITE_LOCALE, TWITTER_IMAGE_URL, absoluteOgImage, jsonLdScript } from "@/lib/seo";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const [site, siteUrl] = await Promise.all([
    getPublicSiteData(),
    getPublicSiteUrl(),
  ]);
  const description =
    site.description || "A portfolio of projects, experience, and skills.";

  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    applicationName: site.name,
    title: {
      default: `${site.name} — ${site.title}`,
      template: `%s | ${site.name}`,
    },
    description,
    keywords: ["portfolio", "developer", "projects", "experience", site.name],
    authors: site.email ? [{ name: site.name, url: siteUrl }] : [{ name: site.name }],
    creator: site.name,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: siteUrl ? { canonical: siteUrl } : undefined,
    openGraph: {
      title: site.name,
      siteName: site.name,
      description,
      locale: SITE_LOCALE,
      ...(siteUrl ? { url: siteUrl } : {}),
      type: "website",
      images: [
        {
          url: absoluteOgImage("/opengraph-image", siteUrl),
          width: 1200,
          height: 630,
          alt: `${site.name} developer portfolio`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: site.name,
      description,
      images: [absoluteOgImage(TWITTER_IMAGE_URL, siteUrl)],
    },
    icons: {
      icon: [
        { url: "/brand/favicon.svg", type: "image/svg+xml" },
        { url: "/brand/favicon-16.png", type: "image/png", sizes: "16x16" },
        { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
        { url: "/brand/favicon-48.png", type: "image/png", sizes: "48x48" },
        { url: "/brand/icon-512.png", type: "image/png", sizes: "512x512" },
      ],
      apple: {
        url: "/brand/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    },
    manifest: "/brand/site.webmanifest",
    category: "portfolio",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [site, siteUrl] = await Promise.all([
    getPublicSiteData(),
    getPublicSiteUrl(),
  ]);

  const personJsonLd = jsonLdScript({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: site.name,
      description: site.description || undefined,
      email: site.email ? `mailto:${site.email}` : undefined,
      url: siteUrl,
      jobTitle: site.title,
      sameAs: site.socialLinks.map((link) => link.href),
    },
  });

  const websiteJsonLd = siteUrl
    ? jsonLdScript({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: site.name,
        url: siteUrl,
      })
    : null;

  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${instrumentSans.variable} ${dmMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: personJsonLd }}
        />
        {websiteJsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
          />
        ) : null}
        {children}
        <Script id="theme-preference" strategy="beforeInteractive">
          {`try {
  const theme = window.localStorage.getItem("amiracle-theme");
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
  }
} catch {
  document.documentElement.dataset.theme = "dark";
}`}
        </Script>
      </body>
    </html>
  );
}
