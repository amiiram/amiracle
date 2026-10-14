"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  burnPasswordVerification,
  clearLoginThrottle,
  issueAdminSession,
  peekLoginThrottle,
  recordLoginFailure,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

/** Generic message reused for both unknown and wrong-password cases. */
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
/** Returned instead of checking credentials once the key is throttled. */
const TOO_MANY_ATTEMPTS_MESSAGE =
  "Too many sign-in attempts. Please wait a few minutes and try again.";

/**
 * Best-effort client identity for the login throttle. `x-forwarded-for` is the
 * first hop only and is spoofable if the app is not behind a proxy, so this
 * key is a speed bump rather than a hard security boundary.
 */
async function resolveClientKey(email: string) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";

  return `${clientIp}:${email}`;
}

export async function loginAction(
  _state: { error?: string; email?: string },
  formData: FormData,
) {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { error: "Email and password are required.", email };
  }

  // Reject an already-locked key before spending a PBKDF2 round on it.
  const throttleKey = await resolveClientKey(email);
  const throttled = peekLoginThrottle(throttleKey);

  if (throttled.throttled) {
    return { error: TOO_MANY_ATTEMPTS_MESSAGE, email };
  }

  const user = await prisma.adminUser.findUnique({
    where: { email },
  });

  // An unknown email still burns the same PBKDF2 work as a real one, so
  // response time cannot be used to enumerate admin accounts.
  if (!user || !user.isActive) {
    burnPasswordVerification(password);
    recordLoginFailure(throttleKey);
    return { error: INVALID_CREDENTIALS_MESSAGE, email };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    const state = recordLoginFailure(throttleKey);
    return {
      error: state.throttled ? TOO_MANY_ATTEMPTS_MESSAGE : INVALID_CREDENTIALS_MESSAGE,
      email,
    };
  }

  // A successful sign-in clears prior failures so a legitimate user who
  // mistyped a few times is not throttled going forward.
  clearLoginThrottle(throttleKey);
  await issueAdminSession(user.id);
  redirect("/admin");
}
