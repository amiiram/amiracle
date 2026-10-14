import crypto from "node:crypto";

import { cache } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  hashPassword as hashPasswordSync,
  verifyPassword as verifyPasswordSync,
} from "@/lib/auth/password.mjs";
import { prisma } from "@/lib/db/prisma";

export { burnPasswordVerification } from "@/lib/auth/password.mjs";

export {
  clearLoginThrottle,
  peekLoginThrottle,
  recordLoginFailure,
} from "@/lib/auth/login-throttle";

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

  if (secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET or NEXTAUTH_SECRET must be at least 32 characters.",
    );
  }
  if (secret === "replace-with-a-long-random-secret") {
    throw new Error("Configure a unique admin session secret before login.");
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
  const signatureBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expectedSignature);

  if (
    signatureBytes.length !== expectedBytes.length ||
    !crypto.timingSafeEqual(signatureBytes, expectedBytes)
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

export async function hashPassword(password: string) {
  return hashPasswordSync(password);
}

export async function verifyPassword(password: string, hash: string) {
  return verifyPasswordSync(password, hash);
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

/**
 * Memoized per render pass: the dashboard layout and each page/action call
 * `requireAdminSession()`, so without `cache()` every request would query the
 * admin row once per call site.
 */
export const getCurrentAdminUser = cache(async () => {
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
});

export async function requireAdminSession() {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}
