import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

/**
 * Shared admin chrome: metadata (noindex) applies to every admin route,
 * including the login page. The dashboard header lives in the nested
 * `(dashboard)` layout so unauthenticated pages stay bare.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}

