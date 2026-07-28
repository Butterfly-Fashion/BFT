"use client";

import { useState } from "react";
import { toggleEmergencySwitchAction } from "@/app/actions";
import type { EmergencySwitchRow } from "@/lib/emergency-switches";

const TIER_STYLE: Record<string, string> = {
  "1단계": "border-amber-200 bg-amber-50",
  "2단계 (B2B)": "border-orange-200 bg-orange-50",
  "2단계 (B2C)": "border-orange-200 bg-orange-50",
  "3단계": "border-red-300 bg-red-50",
};

export function EmergencySwitchCard({
  row,
  info,
}: {
  row: EmergencySwitchRow;
  info: { tier: string; title: string; blocks: string; useWhen: string };
}) {
  const [message, setMessage] = useState(row.customer_message);
  const [reason, setReason] = useState(row.reason || "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const turningOn = submitter?.value === "true";
    if (turningOn && !window.confirm(`"${info.title}"을(를) 켭니다.\n\n${info.blocks}\n\n계속할까요?`)) {
      e.preventDefault();
    }
  }

  return (
    <div className={`rounded-xl border p-5 ${TIER_STYLE[info.tier] || "border-slate-200 bg-white"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">{info.tier}</p>
          <h3 className="mt-0.5 text-lg font-black text-slate-900">{info.title}</h3>
        </div>
        <span
          className={`badge shrink-0 ${
            row.enabled ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white text-slate-500"
          }`}
        >
          {row.enabled ? "켜짐 (차단 중)" : "꺼짐"}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-700">{info.blocks}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">쓰는 상황: {info.useWhen}</p>

      {row.enabled && (
        <div className="mt-3 rounded-lg border border-red-200 bg-white/60 px-3 py-2 text-xs text-slate-600">
          <p>
            <span className="font-bold">{row.enabled_at ? new Date(row.enabled_at).toLocaleString("ko-CA") : "—"}</span>
            {row.enabled_by ? ` · ${row.enabled_by}` : ""}
          </p>
          {row.reason && <p className="mt-0.5">사유: {row.reason}</p>}
        </div>
      )}

      <form action={toggleEmergencySwitchAction} onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input type="hidden" name="key" value={row.key} />

        <label className="block">
          <span className="text-xs font-bold text-slate-600">고객에게 보여줄 메시지</span>
          <textarea
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="field mt-1 w-full text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-slate-600">사유 메모 (내부용, 선택)</span>
          <input
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예: 결제 이중청구 의심으로 임시 차단"
            className="field mt-1 w-full text-sm"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            name="enabled"
            value="true"
            disabled={row.enabled}
            className="btn-danger min-h-9 flex-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            켜기 (차단 시작)
          </button>
          <button
            type="submit"
            name="enabled"
            value="false"
            disabled={!row.enabled}
            className="btn-secondary min-h-9 flex-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            끄기 (차단 해제)
          </button>
        </div>
      </form>
    </div>
  );
}
