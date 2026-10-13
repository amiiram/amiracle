import type { Metadata } from "next";
import { DM_Mono, Instrument_Sans } from "next/font/google";
import Script from "next/script";
import { getPublicSiteData } from "@/lib/portfolio-data";
import { getPublicSiteUrl } from "@/lib/env";
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

export async function generateMetadata(): Promise<Metadata> {
  const [site, siteUrl] = await Promise.all([
    getPublicSiteData(),
    getPublicSiteUrl(),
  ]);
  const description =
    site.description || "A portfolio of projects, experience, and skills.";

  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title: {
      default: site.name,
      template: `%s | ${site.name}`,
    },
    description,
    openGraph: {
      title: site.name,
      description,
      ...(siteUrl ? { url: siteUrl } : {}),
      type: "website",
    },
    twitter: {
      card: "summary",
      title: site.name,
      description,
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
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${instrumentSans.variable} ${dmMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body>
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
