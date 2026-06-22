// Customer-facing contact details. Orders typically come in by phone or email,
// so these are surfaced prominently across the store.
export const CONTACT_EMAIL = "jameskimkim1@gmail.com";
export const CONTACT_PHONE = "+1-416-785-5999";

export const contactMailto = `mailto:${CONTACT_EMAIL}`;
export const contactTel = `tel:${CONTACT_PHONE.replace(/[^+\d]/g, "")}`;
