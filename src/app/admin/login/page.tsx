import { redirect } from "next/navigation";

import { getCurrentAdminUser } from "@/lib/auth";

import { AdminLoginForm } from "./login-form";

/**
 * Server wrapper around the client login form. Already-authenticated admins
 * are sent straight to the dashboard instead of seeing the sign-in form again.
 */
export default async function AdminLoginPage() {
  const user = await getCurrentAdminUser();

  if (user) {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}
