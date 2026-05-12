import { createHash } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "wfg_admin";

export function computeAdminToken(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function verifyAdminCookie(): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  return token === computeAdminToken(adminPassword);
}
