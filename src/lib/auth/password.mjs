import crypto from "node:crypto";

const ITERATIONS = 210_000;

/**
 * @param {string} password
 * @returns {string}
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    64,
    "sha256",
  );

  return `pbkdf2_sha256$${ITERATIONS}$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

/**
 * @param {string} password
 * @param {string} hash
 * @returns {boolean}
 */
export function verifyPassword(password, hash) {
  const parts = hash.split("$");

  if (
    parts.length !== 4 ||
    parts[0] !== "pbkdf2_sha256" ||
    !/^\d+$/.test(parts[1]) ||
    !/^[\da-f]{32}$/i.test(parts[2]) ||
    !/^[\da-f]{128}$/i.test(parts[3])
  ) {
    return false;
  }

  const iterations = Number(parts[1]);
  if (iterations < 120_000 || iterations > 1_000_000) {
    return false;
  }

  const salt = Buffer.from(parts[2], "hex");
  const expected = Buffer.from(parts[3], "hex");
  const actual = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha256");

  return crypto.timingSafeEqual(actual, expected);
}
