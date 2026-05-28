import Link from "next/link";
import { ClipboardList, Lock } from "lucide-react";
import { Header } from "@/components/store/header";
import { getCurrentProfile } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitPreorderCommitmentAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function PreordersPage() {
  const profile = await getCurrentProfile();
  const isApproved = profile?.is_b2b_approved ?? false;
  const supabase = await createSupabaseServerClient();

  const { data: campaigns } = isApproved
    ? await supabase
        .from("preorder_campaigns")
        .select("*, products(name, slug, image_url, sku, category)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
    : { data: null };

  const campaignIds = (campaigns || []).map((c) => c.id);
  const { data: myCommitments } = profile && campaignIds.length
    ? await supabase
        .from("preorder_commitments")
        .select("campaign_id, quantity, notes")
        .eq("customer_id", profile.id)
        .in("campaign_id", campaignIds)
    : { data: null };

  const commitMap = new Map((myCommitments || []).map((c) => [c.campaign_id, c]));

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-8">
        <div className="mb-8 border-b border-slate-100 pb-6">
          <p className="mb-1 text-xs font-black uppercase tracking-widest text-(--primary)">Pre-order</p>
          <h1 className="text-3xl font-black text-slate-900">Pre-order Campaigns</h1>
          <p className="mt-2 text-sm text-slate-500">
            현재 재고가 없지만 발주 예정인 상품입니다. 원하는 수량을 입력하시면 우선 발주 시 반영됩니다.
          </p>
        </div>

        {!profile && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 py-16 text-center">
            <Lock size={32} className="text-slate-300" />
            <div>
              <p className="font-black text-slate-700">로그인이 필요합니다</p>
              <p className="mt-1 text-sm text-slate-500">승인된 B2B 계정으로 로그인 후 프리오더에 참여할 수 있습니다.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/login" className="btn-primary text-sm">로그인</Link>
              <Link href="/register" className="btn-secondary text-sm">계정 신청</Link>
            </div>
          </div>
        )}

        {profile && !isApproved && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-100 bg-amber-50 py-16 text-center">
            <ClipboardList size={32} className="text-amber-400" />
            <div>
              <p className="font-black text-amber-800">승인 대기 중입니다</p>
              <p className="mt-1 text-sm text-amber-700">B2B 계정 승인 후 프리오더 캠페인을 확인하고 참여할 수 있습니다.</p>
            </div>
          </div>
        )}

        {isApproved && (
          <>
            {!(campaigns?.length) && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                <ClipboardList size={32} className="text-slate-300" />
                <p className="font-bold text-slate-500">현재 진행 중인 프리오더가 없습니다.</p>
                <p className="text-sm text-slate-400">새 캠페인이 열리면 이 페이지에서 확인하세요.</p>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(campaigns || []).map((campaign) => {
                const product = Array.isArray(campaign.products) ? campaign.products[0] : campaign.products;
                const myCommit = commitMap.get(campaign.id);
                return (
                  <div key={campaign.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    {/* Product image */}
                    {product?.image_url && (
                      <div className="aspect-video overflow-hidden bg-slate-50">
                        <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-4" />
                      </div>
                    )}

                    <div className="p-5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {product?.category}
                      </span>
                      <h2 className="mt-1 text-lg font-black text-slate-900">{campaign.title}</h2>
                      {campaign.description && (
                        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{campaign.description}</p>
                      )}

                      {/* Pricing */}
                      <div className="mt-4 grid gap-1.5 rounded-xl bg-slate-50 p-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-slate-500">낱개 가격</span>
                          <span className="font-black text-slate-900">{formatMoney(campaign.unit_price)}</span>
                        </div>
                        {campaign.case_price != null && campaign.case_qty && (
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-slate-500">케이스 ({campaign.case_qty}개)</span>
                            <span className="font-black text-slate-900">{formatMoney(campaign.case_price)}</span>
                          </div>
                        )}
                      </div>

                      {/* Commitment form */}
                      <form action={submitPreorderCommitmentAction} className="mt-4 grid gap-3">
                        <input type="hidden" name="campaign_id" value={campaign.id} />
                        <label className="label">
                          {myCommit ? "내 수량 수정" : "참여 수량 (낱개 기준)"}
                          <input
                            className="field"
                            name="quantity"
                            type="number"
                            min="1"
                            defaultValue={myCommit?.quantity ?? ""}
                            placeholder="수량 입력"
                            required
                          />
                        </label>
                        <label className="label">
                          메모 (optional)
                          <input
                            className="field"
                            name="notes"
                            type="text"
                            defaultValue={myCommit?.notes ?? ""}
                            placeholder="옵션, 색상 등 특이사항"
                          />
                        </label>
                        <button className="btn-primary w-full" type="submit">
                          {myCommit ? "수량 수정" : "프리오더 참여"}
                        </button>
                        {myCommit && (
                          <p className="text-center text-xs font-semibold text-slate-400">
                            현재 참여 수량: <strong className="text-slate-700">{myCommit.quantity}개</strong>
                          </p>
                        )}
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </>
  );
}
