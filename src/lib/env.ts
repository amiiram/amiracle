import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      NODE_ENV: process.env.NODE_ENV ?? "development",
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    };

export function getPublicSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!value) {
    return undefined;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    (process.env.NODE_ENV === "production" &&
      url.protocol !== "https:" &&
      url.hostname !== "localhost" &&
      url.hostname !== "127.0.0.1")
  ) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must use HTTPS in production (except for localhost) and HTTP or HTTPS otherwise.",
    );
  }

  return url.origin;
}

export function getDatabaseUrl() {
  return (
    env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/amiracle"
  );
}
