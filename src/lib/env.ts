import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.url().optional(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // Fail fast in production so a misconfigured deploy never serves with
  // silently missing values. In development the raw values are exposed so
  // optional keys can stay unset locally.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `Invalid environment variables: ${parsedEnv.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  console.warn(
    "Environment validation warnings:",
    parsedEnv.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; "),
  );
}

export const env: z.infer<typeof envSchema> = parsedEnv.success
  ? parsedEnv.data
  : {
      NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production" | undefined) ?? "development",
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
