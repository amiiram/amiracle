import type { Metadata } from "next";

export const siteMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Amiracle",
    template: "%s | Amiracle",
  },
  description: "Personal portfolio and developer platform foundation.",
  openGraph: {
    title: "Amiracle",
    description: "Personal portfolio and developer platform foundation.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amiracle",
    description: "Personal portfolio and developer platform foundation.",
  },
};
