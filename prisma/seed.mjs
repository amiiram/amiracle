import crypto from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { hashPassword } from "../src/lib/auth/password.mjs";

const seedEnvironmentSchema = z.object({
  ADMIN_EMAIL: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  ADMIN_USERNAME: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/),
  ADMIN_PASSWORD: z
    .string()
    .min(16)
    .refine(
      (value) => !/(replace-with|change-this|example)/i.test(value),
      "Use a unique password instead of an example value",
    ),
  ADMIN_NAME: z.string().trim().max(160).optional(),
});

export function readSeedEnvironment(environment) {
  const parsed = seedEnvironmentSchema.safeParse(environment);

  if (!parsed.success) {
    throw new Error(
      "Set a valid ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD (at least 16 characters) before seeding.",
    );
  }

  return parsed.data;
}

export async function bootstrapAdmin(client, environment) {
  const config = readSeedEnvironment(environment);
  const passwordHash = hashPassword(config.ADMIN_PASSWORD);

  await client.adminUser.upsert({
    where: { email: config.ADMIN_EMAIL },
    create: {
      id: crypto.randomUUID(),
      email: config.ADMIN_EMAIL,
      username: config.ADMIN_USERNAME,
      passwordHash,
      name: config.ADMIN_NAME || null,
      isActive: true,
      updatedAt: new Date(),
    },
    update: {},
  });
}

async function runSeed() {
  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient();

  try {
    await bootstrapAdmin(client, process.env);
    console.log("Database seed completed; existing admin accounts were preserved.");
  } finally {
    await client.$disconnect();
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  runSeed().catch((error) => {
    console.error(
      "Database seed failed.",
      error instanceof Error ? error.name : "Unknown error",
    );
    process.exitCode = 1;
  });
}
