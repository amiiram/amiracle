import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { getPublicSiteData } from "@/lib/portfolio-data";
import { getPublicSiteUrl } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
