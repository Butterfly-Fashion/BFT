"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { computeAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";

export async function adminLogin(formData: FormData) {
  const password = (formData.get("password") as string) ?? "";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    redirect("/admin?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, computeAdminToken(adminPassword), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  redirect("/admin");
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin");
}
