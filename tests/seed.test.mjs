import assert from "node:assert/strict";
import test from "node:test";

import { bootstrapAdmin, readSeedEnvironment } from "../prisma/seed.mjs";
import {
  hashPassword,
  verifyPassword,
} from "../src/lib/auth/password.mjs";

const validEnvironment = {
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_USERNAME: "admin-user",
  ADMIN_PASSWORD: "a-long-test-password",
};

test("seed environment requires valid admin values", () => {
  assert.throws(() => readSeedEnvironment({}), /Set a valid ADMIN_EMAIL/);
  assert.throws(
    () =>
      readSeedEnvironment({
        ...validEnvironment,
        ADMIN_PASSWORD: "short",
      }),
    /Set a valid ADMIN_EMAIL/,
  );
  assert.equal(
    readSeedEnvironment(validEnvironment).ADMIN_EMAIL,
    "admin@example.com",
  );
});

test("admin bootstrap creates without overwriting an existing account", async () => {
  const calls = [];
  const client = {
    adminUser: {
      async upsert(args) {
        calls.push(args);
        return args.create;
      },
    },
  };

  await bootstrapAdmin(client, validEnvironment);
  await bootstrapAdmin(client, {
    ...validEnvironment,
    ADMIN_PASSWORD: "a-different-long-password",
  });

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].update, {});
  assert.equal(calls[0].create.email, validEnvironment.ADMIN_EMAIL);
  assert.notEqual(calls[0].create.passwordHash, validEnvironment.ADMIN_PASSWORD);
  assert.notEqual(calls[1].create.passwordHash, calls[0].create.passwordHash);
});

test("password hashes verify and reject malformed or incorrect credentials", () => {
  const hash = hashPassword(validEnvironment.ADMIN_PASSWORD);

  assert.equal(verifyPassword(validEnvironment.ADMIN_PASSWORD, hash), true);
  assert.equal(verifyPassword("incorrect-password", hash), false);
  assert.equal(
    verifyPassword("anything", "pbkdf2_sha256$999999999$aa$bb"),
    false,
  );
});
