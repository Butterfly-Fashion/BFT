export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Create web/.env.local from web/.env.example and fill in your Supabase project values.`
    );
  }
  return value;
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.mask12.com";
}
