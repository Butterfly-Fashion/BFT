import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";

const SUPABASE_URL = "https://zgztvepfolbztbweoxcl.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenR2ZXBmb2xienRid2VveGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA1OTgwNywiZXhwIjoyMDkzNjM1ODA3fQ.GbgWafFNj45TKFABXmmviCgyWUQHHsVSGcxtcr3EhRk";
const BASE = "http://localhost:3002";

export const TEST_ADMIN = {
  email: "test.admin.b2b@butterfly.test",
  password: "ButterflyAdmin2026!",
};
export const TEST_CUSTOMER = {
  email: "test.customer.b2b@butterfly.test",
  password: "ButterflyCustomer2026!",
};
export const ADMIN_STATE_FILE = "tests/admin-state.json";
export const CUSTOMER_STATE_FILE = "tests/customer-state.json";

async function deleteIfExists(
  admin: ReturnType<typeof createClient>,
  email: string
) {
  const { data } = await admin.auth.admin.listUsers();
  const existing = data?.users?.find((u) => u.email === email);
  if (existing) {
    await admin.from("profiles").delete().eq("auth_user_id", existing.id);
    await admin.auth.admin.deleteUser(existing.id);
  }
}

async function saveStorageState(email: string, password: string, file: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 20_000 });
  await context.storageState({ path: file });
  await browser.close();
  console.log(`  💾 Auth state saved: ${file}`);
}

export default async function globalSetup() {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Remove old test accounts if they exist
  await deleteIfExists(admin, TEST_ADMIN.email);
  await deleteIfExists(admin, TEST_CUSTOMER.email);

  // Create test admin
  const { data: adminAuth, error: adminErr } =
    await admin.auth.admin.createUser({
      email: TEST_ADMIN.email,
      password: TEST_ADMIN.password,
      email_confirm: true,
    });
  if (adminErr || !adminAuth.user)
    throw new Error(`Admin user create failed: ${adminErr?.message}`);

  await admin.from("profiles").insert({
    auth_user_id: adminAuth.user.id,
    role: "admin",
    email: TEST_ADMIN.email,
    business_name: "Test Admin Co",
    contact_name: "Test Admin",
    phone: "",
    business_address: "123 Test St",
    city: "Toronto",
    province: "ON",
    postal_code: "M1A 1A1",
    country: "Canada",
    business_type: "Admin",
    is_b2b_approved: true,
  });

  // Create test customer (unapproved initially)
  const { data: custAuth, error: custErr } =
    await admin.auth.admin.createUser({
      email: TEST_CUSTOMER.email,
      password: TEST_CUSTOMER.password,
      email_confirm: true,
    });
  if (custErr || !custAuth.user)
    throw new Error(`Customer user create failed: ${custErr?.message}`);

  await admin.from("profiles").insert({
    auth_user_id: custAuth.user.id,
    role: "customer",
    email: TEST_CUSTOMER.email,
    business_name: "Test Customer Ltd",
    contact_name: "Test Customer",
    phone: "416-000-0000",
    business_address: "456 Test Ave",
    city: "Toronto",
    province: "ON",
    postal_code: "M2B 2B2",
    country: "Canada",
    business_type: "Retailer",
    is_b2b_approved: false,
  });

  console.log("✅ Test accounts created in DB");

  // Save browser auth states (requires the dev server to be running)
  await saveStorageState(TEST_ADMIN.email, TEST_ADMIN.password, ADMIN_STATE_FILE);
  await saveStorageState(TEST_CUSTOMER.email, TEST_CUSTOMER.password, CUSTOMER_STATE_FILE);

  console.log("✅ Auth states saved");
}
