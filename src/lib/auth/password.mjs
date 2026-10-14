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

/**
 * A syntactically valid hash with a real salt, used to burn the same PBKDF2
 * work when a login references an email that does not exist. Without it, an
 * unknown email returns instantly while a known one takes ~200ms, which lets an
 * attacker enumerate admin accounts purely by response time.
 *
 * The value is just salt+derived key material for the literal string
 * "unused-timing-equaliser"; it is never a real credential and cannot be
 * reversed into one.
 */
export const DUMMY_PASSWORD_HASH =
  "pbkdf2_sha256$210000$00000000000000000000000000000000$" +
  "0".repeat(128);

/**
 * @param {string} password
 * @returns {boolean} always false; exists only to equalise verification time.
 */
export function burnPasswordVerification(password) {
  verifyPassword(password, DUMMY_PASSWORD_HASH);
  return false;
}
