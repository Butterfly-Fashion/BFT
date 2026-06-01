/**
 * cleanup-accounts.mjs
 * gksrual0813@gmail.com 관리자 계정을 제외한 모든 auth 유저 및 profile 삭제
 * Usage: node scripts/cleanup-accounts.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zgztvepfolbztbweoxcl.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenR2ZXBmb2xienRid2VveGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA1OTgwNywiZXhwIjoyMDkzNjM1ODA3fQ.GbgWafFNj45TKFABXmmviCgyWUQHHsVSGcxtcr3EhRk";

const KEEP_EMAILS = new Set(["gksrual0813@gmail.com"]);

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("🔍 Fetching all auth users...");

  // Supabase listUsers returns up to 1000 per page
  let page = 1;
  const allUsers = [];
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.error("listUsers error:", error.message); break; }
    if (!data?.users?.length) break;
    allUsers.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }

  const toDelete = allUsers.filter((u) => !KEEP_EMAILS.has(u.email ?? ""));
  console.log(`📋 Total users: ${allUsers.length}`);
  console.log(`🗑️  To delete:   ${toDelete.length}`);
  console.log(`✅ To keep:     ${allUsers.length - toDelete.length}`);

  if (toDelete.length === 0) {
    console.log("Nothing to delete. Done.");
    return;
  }

  let deleted = 0;
  let failed = 0;

  for (const user of toDelete) {
    try {
      // Delete profile first (FK)
      await admin.from("profiles").delete().eq("auth_user_id", user.id);
      // Delete auth user
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) throw error;
      console.log(`  ✓ Deleted: ${user.email ?? user.id}`);
      deleted++;
    } catch (err) {
      console.error(`  ✗ Failed:  ${user.email ?? user.id} — ${err.message}`);
      failed++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Deleted: ${deleted}`);
  console.log(`Failed:  ${failed}`);
  console.log(`Kept:    ${KEEP_EMAILS.size}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
