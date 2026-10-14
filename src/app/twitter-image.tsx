import { ImageResponse } from "next/og";

import { SocialPreviewCard } from "@/components/social-preview-card";

export const alt =
  "Amiracle developer portfolio: projects, experience, and skills.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(<SocialPreviewCard />, {
    ...size,
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
