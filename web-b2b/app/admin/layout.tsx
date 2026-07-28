import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getEmergencySwitches, SWITCH_INFO } from "@/lib/emergency-switches";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const switches = await getEmergencySwitches();
  const active = switches.filter((s) => s.enabled);

  return (
    <>
      {active.length > 0 && (
        <div className="bg-red-600 px-4 py-2 text-center text-xs font-bold text-white">
          🚨 비상 스위치 켜짐: {active.map((s) => SWITCH_INFO[s.key].title).join(", ")}
          {" — "}
          <Link href="/admin/emergency" className="underline">관리</Link>
        </div>
      )}
      {children}
    </>
  );
}
