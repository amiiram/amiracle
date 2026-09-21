import crypto from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

export const adminSessionCookie = "amiracle_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getSessionSecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(
      "Missing ADMIN_SESSION_SECRET or NEXTAUTH_SECRET. Set a strong secret before enabling admin sessions.",
    );
  }

  return secret;
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signTokenSegment(value: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

export function verifySessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const segments = token.split(".");
  if (segments.length !== 2) {
    return null;
  }

  const [payloadSegment, signature] = segments;
  const expectedSignature = signTokenSegment(payloadSegment);

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    )
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadSegment)) as {
      sub?: string;
      exp?: number;
    };

    if (!payload.sub || typeof payload.exp !== "number") {
      return null;
    }

    if (payload.exp <= Date.now() / 1000) {
      return null;
    }

    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

export async function ensureInitialAdminUser() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  const username = process.env.ADMIN_USERNAME?.trim() || email.split("@")[0];

  const existing = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existing) {
    return existing;
  }

  const passwordHash = await hashPassword(password);

  return prisma.adminUser.create({
    data: {
      email,
      username,
      name: "Owner",
      passwordHash,
      isActive: true,
    },
  });
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha256");

  return `pbkdf2_sha256$${120000}$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string) {
  const parts = hash.split("$");

  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") {
    return false;
  }

  const iterations = Number(parts[1]);
  const salt = Buffer.from(parts[2], "hex");
  const expected = Buffer.from(parts[3], "hex");
  const actual = crypto.pbkdf2Sync(
    password,
    salt,
    iterations,
    expected.length,
    "sha256",
  );

  return crypto.timingSafeEqual(actual, expected);
}

export async function issueAdminSession(userId: string) {
  const expiresAt = Math.floor(
    (Date.now() + SESSION_TTL_SECONDS * 1000) / 1000,
  );
  const payload = { sub: userId, exp: expiresAt };
  const serialized = toBase64Url(JSON.stringify(payload));
  const token = `${serialized}.${signTokenSegment(serialized)}`;

  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(adminSessionCookie);
}

export async function getCurrentAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(adminSessionCookie)?.value;
  return verifySessionToken(sessionToken);
}

export async function getCurrentAdminUser() {
  const session = await getCurrentAdminSession();

  if (!session) {
    return null;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.sub },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export async function requireAdminSession() {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}
