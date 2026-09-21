"use server";

import { redirect } from "next/navigation";

import { issueAdminSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function loginAction(
  _state: { error?: string; email?: string },
  formData: FormData,
) {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { error: "Email and password are required.", email };
  }

  const user = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    return { error: "Invalid email or password.", email };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password.", email };
  }

  await issueAdminSession(user.id);
  redirect("/admin");
}
