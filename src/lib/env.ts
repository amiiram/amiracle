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

export function getDatabaseUrl() {
  return (
    env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/amiracle"
  );
}
