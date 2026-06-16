import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("auth_user_id", user.id).single();
  return data as Profile | null;
}

export async function requireProfile(redirectTo = "/login") {
  const profile = await getCurrentProfile();
  if (!profile) redirect(redirectTo);
  return profile;
}

export async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/");
  return profile;
}
