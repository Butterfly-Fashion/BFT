import { AdminNav } from "@/components/admin/admin-nav";
import { EmergencySwitchCard } from "@/components/admin/emergency-switch-card";
import { getEmergencySwitches, SWITCH_INFO } from "@/lib/emergency-switches";

export const dynamic = "force-dynamic";

export default async function EmergencySwitchesPage() {
  const switches = await getEmergencySwitches();

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <div className="mb-5">
          <p className="section-label">비상 대응</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">비상 스위치</h1>
          <p className="mt-1.5 max-w-2xl text-sm font-medium text-slate-500">
            결제·주문 사고가 의심될 때 재배포나 개발자 호출 없이 즉시 막는 버튼입니다. 여기서 켜면 서버에서 실제로
            차단되고, 화면에는 위에 입력한 메시지가 고객에게 보입니다.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {switches.map((row) => (
            <EmergencySwitchCard key={row.key} row={row} info={SWITCH_INFO[row.key]} />
          ))}
        </div>
      </main>
    </>
  );
}
