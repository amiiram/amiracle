import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Amiracle | Developer Portfolio",
    template: "%s | Amiracle",
  },
  description:
    "Amiracle is a frontend-first developer portfolio for building thoughtful product experiences, systems, and real-world web products.",
  openGraph: {
    title: "Amiracle | Developer Portfolio",
    description:
      "Frontend-focused developer building product experiences, systems, and polished web products.",
    url: siteUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amiracle | Developer Portfolio",
    description:
      "Frontend-focused developer building product experiences, systems, and polished web products.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
