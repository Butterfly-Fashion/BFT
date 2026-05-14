function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const env = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: optional("SUPABASE_SERVICE_ROLE_KEY"),
  siteUrl: optional("NEXT_PUBLIC_SITE_URL", "http://localhost:3001"),
  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripePublishableKey: optional("STRIPE_PUBLISHABLE_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  emailFrom: optional("EMAIL_FROM", "World Fan Gear <jameskimkim1@gmail.com>"),
  smtpHost: optional("SMTP_HOST"),
  smtpPort: parseInt(optional("SMTP_PORT", "587")),
  smtpUser: optional("SMTP_USER"),
  smtpPass: optional("SMTP_PASS"),
};
