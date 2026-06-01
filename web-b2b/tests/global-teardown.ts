import { createClient } from "@supabase/supabase-js";
import { TEST_ADMIN, TEST_CUSTOMER } from "./global-setup";

const SUPABASE_URL = "https://zgztvepfolbztbweoxcl.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenR2ZXBmb2xienRid2VveGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA1OTgwNywiZXhwIjoyMDkzNjM1ODA3fQ.GbgWafFNj45TKFABXmmviCgyWUQHHsVSGcxtcr3EhRk";

async function deleteAccount(
  admin: ReturnType<typeof createClient>,
  email: string
) {
  const { data } = await admin.auth.admin.listUsers();
  const user = data?.users?.find((u) => u.email === email);
  if (user) {
    await admin.from("profiles").delete().eq("auth_user_id", user.id);
    await admin.auth.admin.deleteUser(user.id);
    console.log(`🗑️  Deleted test account: ${email}`);
  }
}

export default async function globalTeardown() {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Clean up test products
  const { data: testProds } = await admin.from("products").select("id").ilike("name", "E2E%");
  for (const p of testProds || []) {
    await admin.from("order_items").delete().eq("product_id", p.id);
    await admin.from("customer_prices").delete().eq("product_id", p.id);
    await admin.from("products").delete().eq("id", p.id);
  }

  // Clean up test preorder campaigns
  const { data: camps } = await admin.from("preorder_campaigns").select("id").ilike("title", "E2E%");
  for (const c of camps || []) {
    await admin.from("preorder_commitments").delete().eq("campaign_id", c.id);
    await admin.from("preorder_campaigns").delete().eq("id", c.id);
  }

  // Clean up test categories
  await admin.from("b2b_categories").delete().ilike("name", "E2E%");

  // Clean up test accounts
  await deleteAccount(admin, TEST_ADMIN.email);
  await deleteAccount(admin, TEST_CUSTOMER.email);
  console.log("✅ Test data and accounts cleaned up");
}
