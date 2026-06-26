// Cart quantities are always stored as individual units (pieces). This formats a
// quantity into a clear label that distinguishes case/display products (sold in
// fixed packs, e.g. 12 ea per display) from items counted individually.

export function formatUnitLabel(quantity: number, caseQty?: number | null): string {
  if (caseQty && caseQty > 0) {
    const displays = quantity / caseQty;
    if (Number.isInteger(displays)) {
      return `${displays} display${displays === 1 ? "" : "s"} (${caseQty} ea) = ${quantity} units`;
    }
    // Non-multiple (shouldn't happen via case-snapped inputs, but stay correct).
    return `${quantity} units · 1 display = ${caseQty} ea`;
  }
  return `${quantity} unit${quantity === 1 ? "" : "s"}`;
}
