"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateTotals, formatMoney } from "@/lib/money";
import {
  sendEmail, emailHtml,
  registrationEmail, orderReceivedEmail, adminNewOrderEmail,
  paymentLinkEmail, cardByTextPaymentEmail, eTransferPaymentEmail, manualPaymentEmail,
  b2bApprovedEmail, b2bRejectedEmail, adminNewLeadEmail,
  adminNewMessageEmail,
} from "@/lib/email";
import { createOrderCheckoutSession } from "@/lib/stripe";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireAdmin, requireProfile } from "@/lib/auth";
import { isOutOfStock } from "@/lib/availability";
import { siteUrl } from "@/lib/env";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function skuPrefixForCategory(category: string) {
  if (category === "Car Flags") return "FLAG";
  if (category === "Caps") return "CAP";
  if (category === "Bucket Hats") return "HAT";
  if (category === "Boxing Gloves") return "BG";
  if (category === "Accessories") return "ACC";
  return "PROD";
}

function friendlyAuthError(message?: string) {
  const text = (message || "").toLowerCase();
  if (text.includes("invalid login credentials")) {
    return "The email or password is incorrect. Please check your details and try again.";
  }
  if (text.includes("email not confirmed")) {
    return "Your account was created, but sign-in is not enabled yet. Please contact us for help.";
  }
  if (text.includes("user already registered") || text.includes("already exists")) {
    return "An account with this email already exists. Please sign in or use a different email.";
  }
  if (text.includes("password should be at least") || text.includes("password is too short")) {
    return "Password must be at least 6 characters long.";
  }
  if (text.includes("password")) {
    return "Please choose a stronger password and try again.";
  }
  if (
    text.includes("rate limit") ||
    text.includes("too many") ||
    text.includes("only request this once") ||
    text.includes("request this after") ||
    text.includes("security purposes")
  ) {
    return "Too many attempts — please wait a minute before trying again.";
  }
  if (text.includes("signup is disabled")) {
    return "New registrations are temporarily unavailable. Please try again later.";
  }
  return "Something went wrong. Please try again, or contact us if the issue continues.";
}

function friendlyDatabaseError(action: string, message?: string) {
  const text = (message || "").toLowerCase();
  if (text.includes("duplicate") || text.includes("unique constraint")) {
    return "This record already exists. Please check the email, SKU, slug, or barcode and try again.";
  }
  if (text.includes("permission") || text.includes("row-level security") || text.includes("unauthorized")) {
    return "You do not have permission to complete this action. Please sign in with the correct account.";
  }
  return `We could not ${action} right now. Please try again.`;
}

function errorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const record = err as Record<string, unknown>;
    return String(
      record.message ||
      record.details ||
      record.hint ||
      record.code ||
      JSON.stringify(record)
    );
  }
  return String(err);
}

async function uniqueProductValue(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  field: "slug" | "sku",
  baseValue: string,
  currentId?: string
) {
  const fallback = field === "slug" ? `product-${Date.now()}` : `PROD-${Date.now()}`;
  const cleanBase = baseValue || fallback;
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? cleanBase : `${cleanBase}-${i + 1}`;
    let query = admin.from("products").select("id").eq(field, candidate);
    if (currentId) query = query.neq("id", currentId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }
  return `${cleanBase}-${Date.now()}`;
}

async function saveProductImage(file: File, slug: string) {
  if (!file.size) return null;
  if (!file.type.startsWith("image/")) throw new Error("Please upload a valid image file.");
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) throw new Error("Image must be under 5 MB.");

  const extFromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  const extFromType = file.type.split("/")[1]?.replace("jpeg", "jpg");
  const ext = extFromName || extFromType || "jpg";
  const safeName = `${slug}-${Date.now()}.${ext}`;

  const admin = createSupabaseAdminClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("product-images").upload(safeName, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data: { publicUrl } } = admin.storage.from("product-images").getPublicUrl(safeName);
  return publicUrl;
}

const registerSchema = z
  .object({
    business_name: z.string().min(2, "Please enter your business name."),
    contact_name: z.string().min(2, "Please enter the main contact name."),
    email: z.string().email("Please enter a valid email address."),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirm_password: z.string().min(1, "Please confirm your password."),
    business_address: z.string().min(3, "Please enter your street address."),
    city: z.string().min(2, "Please enter your city."),
    province: z.string().min(2, "Please enter your province or state."),
    postal_code: z.string().min(3, "Please enter your postal code."),
    country: z.string().min(2, "Please enter your country."),
    business_type: z.string().min(2, "Please choose or enter your business type."),
    agree_to_terms: z.literal("on", { error: "Please agree to the terms before creating an account." }),
    tax_number: z.string().optional(),
    website: z.string().optional(),
    notes: z.string().optional(),
    preferred_delivery_method: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.enum(["Pickup", "Shipping"]).optional()
    ),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

type RegisterState = { error?: string; values?: Record<string, string> } | null;

async function insertProfileWithSchemaFallback(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  payload: Record<string, unknown>
) {
  let nextPayload = { ...payload };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { error } = await admin.from("profiles").insert(nextPayload);
    if (!error) return null;

    const missingColumn = error.message.match(/Could not find the '([^']+)' column/)?.[1];
    if (!missingColumn || !(missingColumn in nextPayload)) return error;

    console.warn("[register profile create retry without missing column]", missingColumn);
    const { [missingColumn]: _removed, ...withoutMissingColumn } = nextPayload;
    nextPayload = withoutMissingColumn;
  }

  return new Error("Could not create profile after removing missing schema columns.");
}

export async function registerAction(_prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const safeValues = { ...raw, password: "", confirm_password: "", _ts: Date.now().toString() };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Please check the highlighted account details and try again.", values: safeValues };

  try {
    return await _registerActionInner(parsed.data, safeValues, raw);
  } catch (err: unknown) {
    // Re-throw Next.js internal redirect/notFound errors — they must propagate
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("[registerAction] unhandled error:", errorMessage(err));
    return { error: "Something went wrong. Please try again, or contact us if the issue continues.", values: safeValues };
  }
}

async function _registerActionInner(
  data: ReturnType<typeof registerSchema.parse>,
  safeValues: Record<string, string>,
  raw: Record<string, string>
): Promise<RegisterState> {
  const admin = createSupabaseAdminClient();

  // Pre-check: existing email in profiles (avoids confusing Supabase errors)
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", data.email.toLowerCase())
    .maybeSingle();
  if (existingProfile) {
    return { error: "An account with this email already exists. Please sign in or use a different email.", values: safeValues };
  }

  // Use admin client to create auth user — bypasses per-IP rate limits that
  // affect the public signUp() endpoint. Email confirmation is handled by our
  // own SMTP email below, not Supabase's built-in flow.
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // mark confirmed so user can log in immediately
  });
  if (authError || !authData.user) {
    return { error: friendlyAuthError(authError?.message), values: safeValues };
  }

  const profileError = await insertProfileWithSchemaFallback(admin, {
    auth_user_id: authData.user.id,
    role: "customer",
    business_name: data.business_name,
    contact_name: data.contact_name,
    email: data.email,
    phone: data.phone || "",
    business_address: data.business_address,
    city: data.city,
    province: data.province,
    postal_code: data.postal_code,
    country: data.country,
    business_type: data.business_type,
    is_b2b_approved: true,
    tax_number: data.tax_number || null,
    website: data.website || null,
    notes: data.notes || null,
    preferred_delivery_method: data.preferred_delivery_method || null,
  });
  if (profileError) {
    console.error("[register profile create failed]", profileError.message);
    await admin.auth.admin.deleteUser(authData.user.id).catch((err) => {
      console.error("[register orphan auth cleanup failed]", errorMessage(err));
    });
    return { error: friendlyDatabaseError("create your account", profileError.message), values: safeValues };
  }

  // Newsletter consent
  if (raw.newsletter_consent === "on") {
    await admin.from("newsletter_subscribers").upsert(
      {
        email: data.email,
        name: data.business_name || data.contact_name,
        source: "b2b",
        subscribed_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    ); // non-fatal — ignore error
  }

  await sendEmail({
    to: data.email,
    subject: "Butterfly Fashion Trading — account created",
    html: registrationEmail(data.contact_name || data.business_name, siteUrl()),
  });

  redirect("/login?registered=1");
}

// Only allow same-site relative paths to prevent open-redirect abuse.
function safeRedirectPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const remember = formData.get("remember") === "on";
  // Record the preference before signing in so the cookie adapter (server.ts)
  // can decide whether to persist the Supabase session cookies on this device.
  const cookieStore = await cookies();
  cookieStore.set("bft_remember", remember ? "1" : "0", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendlyAuthError(error.message) };
  redirect(safeRedirectPath(formData.get("next")));
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") || "");
  if (!email) return { error: "Please enter your email address." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error) {
    // "For security purposes, you can only request this once every 60 seconds"
    if (
      error.message.toLowerCase().includes("security purposes") ||
      error.message.toLowerCase().includes("only request this once") ||
      error.message.toLowerCase().includes("too many")
    ) {
      return { error: "Please wait 60 seconds before requesting another reset link." };
    }
  }
  // Always return success to avoid email enumeration
  return { success: "If an account with that email exists, a password reset link has been sent." };
}

export async function resetPasswordAction(_prevState: unknown, formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!password) return { error: "Please enter a password." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "We could not update your password. Please use the latest reset link and try again." };
  redirect("/login");
}

export async function createOrderRequestAction(input: {
  items: Array<{ productId: string; quantity: number }>;
  deliveryMethod: "Pickup" | "Shipping";
  shippingAddress: string;
  customerNotes?: string;
}) {
  const profile = await requireProfile();
  // Use the service-role client (like every other write in this file) and enforce auth in
  // app code via requireProfile above. The order insert previously ran under the user-session
  // client and depended on RLS + a live auth.uid(); during a mid-request token refresh that uid
  // could read as null, making the insert fail with a row-level-security error that surfaced to
  // signed-in customers as "you do not have permission". customer_id is always the authenticated
  // profile.id and prices are computed server-side, so a user cannot order on another account.
  const supabase = createSupabaseAdminClient();

  if (!input.items.length) return { error: "Your request cart is empty. Add at least one product before submitting." };

  const productIds = input.items.map((item) => item.productId);
  const { data: products, error: productsError } = await supabase.from("products").select("*").in("id", productIds);
  if (productsError || !products?.length) return { error: "We could not load the products in your cart. Please refresh the page and try again." };

  const { data: customerPrices } = await supabase
    .from("customer_prices")
    .select("product_id, unit_price")
    .eq("customer_id", profile.id)
    .in("product_id", productIds);

  const priceMap = new Map((customerPrices || []).map((row) => [row.product_id, row.unit_price != null ? Number(row.unit_price) : null]));
  const productMap = new Map(products.map((product) => [product.id, product]));
  if (input.items.some((item) => !productMap.has(item.productId))) {
    return { error: "A product in your cart is no longer available. Please remove it and try again." };
  }

  // Reject out-of-stock items at submit time — the cart may have been filled before the
  // item sold out, so the client-side block alone isn't enough.
  const soldOutNames = input.items
    .map((item) => productMap.get(item.productId))
    .filter((product) => product && isOutOfStock(product))
    .map((product) => product!.name);
  if (soldOutNames.length) {
    return { error: `These items are sold out and can't be ordered: ${soldOutNames.join(", ")}. Please remove them and try again.` };
  }
  const itemSnapshots = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error("Missing product after validation.");
    const quantity = Math.max(1, Number(item.quantity));
    const unitPrice = profile.is_b2b_approved ? (priceMap.get(product.id) ?? Number(product.unit_price)) : Number(product.unit_price);
    return {
      product,
      quantity,
      unitPrice,
      lineTotal: Number((quantity * unitPrice).toFixed(2)),
    };
  });

  // No minimum order quantity — any quantity (1+) can be ordered.
  const totals = calculateTotals(itemSnapshots.map((item) => ({ quantity: item.quantity, unitPrice: item.unitPrice })));

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: profile.id,
      channel: "b2b",
      status: "Pending Review",
      payment_status: "Unpaid",
      subtotal: totals.subtotal,
      // Shipping cost isn't known until the admin reviews the order, so it's left unset
      // (null) for Shipping orders rather than defaulting to 0 — that keeps a genuine "$0
      // shipping" distinguishable from "not decided yet" when the payment link is sent.
      shipping_fee: input.deliveryMethod === "Shipping" ? null : 0,
      discount_amount: 0,
      tax_amount: totals.tax,
      total_amount: totals.total,
      delivery_method: input.deliveryMethod,
      shipping_address: input.deliveryMethod === "Shipping" ? input.shippingAddress : null,
      customer_notes: input.customerNotes || null,
    })
    .select()
    .single();
  if (orderError || !order) return { error: friendlyDatabaseError("submit your order request", orderError?.message) };

  const { error: itemsError } = await supabase.from("order_items").insert(
    itemSnapshots.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name_snapshot: item.product.name,
      sku_snapshot: item.product.sku,
      quantity: item.quantity,
      unit_price_snapshot: item.unitPrice,
      line_total: item.lineTotal,
    }))
  );
  if (itemsError) return { error: friendlyDatabaseError("save the products on your order request", itemsError.message) };

  await sendEmail({
    to: profile.email,
    subject: "Order request received — Butterfly Fashion",
    html: orderReceivedEmail(profile.business_name || profile.contact_name, order.id, siteUrl()),
  });
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `New order request — ${profile.business_name || profile.email}`,
      html: adminNewOrderEmail(profile.business_name || profile.contact_name, order.id, siteUrl()),
    });
  }

  revalidatePath("/admin/orders");
  return { orderId: order.id };
}

type LeadState = { error?: string; success?: boolean } | null;

const leadSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  company: z.string().min(1, "Please enter your company or store name."),
  name: z.string().optional(),
  phone: z.string().optional(),
  expected_quantity: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

export async function submitWholesaleLeadAction(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check your details and try again." };
  }
  const data = parsed.data;
  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("wholesale_leads").insert({
    name: data.name || null,
    company: data.company,
    email: data.email.toLowerCase(),
    phone: data.phone || null,
    expected_quantity: data.expected_quantity || null,
    message: data.message || null,
    source: data.source || null,
  });
  if (error) {
    console.error("[submitWholesaleLeadAction]", error.message);
    return { error: "We couldn't submit your request right now. Please email orders@butterfly-fashion.ca instead." };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `New wholesale catalog request — ${data.company}`,
      html: adminNewLeadEmail(
        {
          name: data.name,
          company: data.company,
          email: data.email,
          phone: data.phone,
          expectedQuantity: data.expected_quantity,
          message: data.message,
          source: data.source,
        },
        siteUrl()
      ),
    }).catch((err) => console.error("[lead admin email failed]", errorMessage(err)));
  }

  revalidatePath("/admin/leads");
  return { success: true };
}

export async function updateOrderReviewAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const orderId = String(formData.get("order_id"));
  // A blank shipping field means "not decided yet" (stored as null) — distinct from an
  // explicitly entered $0. Only the latter allows the payment link to be sent for a
  // Shipping order. Totals below always treat a blank field as 0 for the running total.
  const rawShipping = String(formData.get("shipping_fee") ?? "").trim();
  const shipping: number | null = rawShipping === "" ? null : Math.max(0, Number(rawShipping) || 0);
  const tax = Number(formData.get("tax_amount") || 0);
  const adminNotes = String(formData.get("admin_notes") || "");
  const deliveryMethod = String(formData.get("delivery_method")) as "Pickup" | "Shipping";
  const status = String(formData.get("status") || "");
  const paymentStatus = String(formData.get("payment_status") || "");
  const paymentMethod = String(formData.get("payment_method") || "").trim();
  const shippingAddress = String(formData.get("shipping_address") || "");
  const rawTotalOverride = String(formData.get("total_override") || "").trim();
  const totalOverride = rawTotalOverride === "" ? null : Number(rawTotalOverride);

  // The admin editor posts the full desired line-item set as JSON (existing rows + any
  // added via product search, minus any removed). We swap the order's items to match.
  const hasItemsPayload = formData.get("items_json") !== null;
  type EditItem = { product_id: string | null; name: string; sku: string | null; quantity: number; unit_price: number };
  let editItems: EditItem[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("items_json") || "[]"));
    if (Array.isArray(parsed)) {
      editItems = parsed
        .map((it) => ({
          product_id: it.product_id ? String(it.product_id) : null,
          name: String(it.name || "").trim(),
          sku: it.sku ? String(it.sku) : null,
          quantity: Math.max(1, Math.floor(Number(it.quantity) || 1)),
          unit_price: Math.max(0, Number(it.unit_price) || 0),
        }))
        .filter((it) => it.name);
    }
  } catch { editItems = []; }

  let updatedItems: Array<{ product_id: string | null; quantity: number; line_total: number }> = [];

  if (hasItemsPayload) {
    const newRows = editItems.map((it) => ({
      order_id: orderId,
      product_id: it.product_id,
      product_name_snapshot: it.name,
      sku_snapshot: it.sku,
      quantity: it.quantity,
      unit_price_snapshot: it.unit_price,
      line_total: Number((it.quantity * it.unit_price).toFixed(2)),
    }));
    // Insert the new set first, then delete the previous rows — so a failed insert
    // never wipes the existing items.
    const { data: existing } = await admin.from("order_items").select("id").eq("order_id", orderId);
    let insertOk = true;
    if (newRows.length) {
      const { error: insErr } = await admin.from("order_items").insert(newRows);
      insertOk = !insErr;
    }
    if (insertOk && existing?.length) {
      await admin.from("order_items").delete().in("id", existing.map((r) => r.id));
    }
    updatedItems = newRows.map((r) => ({ product_id: r.product_id, quantity: r.quantity, line_total: r.line_total }));
  } else {
    // No items payload (legacy/no-JS): keep the stored items as-is.
    const { data: items } = await admin.from("order_items").select("*").eq("order_id", orderId);
    updatedItems = (items || []).map((item) => ({ product_id: item.product_id, quantity: item.quantity, line_total: Number(item.line_total) }));
  }

  const subtotal = updatedItems.reduce((sum, item) => sum + Number(item.line_total), 0);

  // Discount: a percentage of subtotal (QuickBooks-style) takes precedence; otherwise a flat dollar amount.
  const rawDiscountPct = String(formData.get("discount_percent") || "").trim();
  const discountPct = rawDiscountPct === "" ? null : Number(rawDiscountPct);
  const flatDiscount = Number(formData.get("discount_amount") || 0);
  const discount =
    discountPct != null && Number.isFinite(discountPct) && discountPct > 0
      ? Number(((subtotal * discountPct) / 100).toFixed(2))
      : flatDiscount;

  const computedTotal = subtotal - discount + (shipping ?? 0) + tax;
  // A manual override (per-customer negotiated total) wins over the item-based calculation.
  const total = totalOverride != null && Number.isFinite(totalOverride) && totalOverride >= 0
    ? totalOverride
    : computedTotal;

  // Deduct stock_qty once when order transitions to Completed
  if (status === "Completed") {
    const { data: currentOrder } = await admin.from("orders").select("status").eq("id", orderId).single();
    if (currentOrder?.status !== "Completed") {
      for (const item of updatedItems) {
        if (!item.product_id) continue;
        const { data: prod } = await admin.from("products").select("stock_qty").eq("id", item.product_id).single();
        if (prod?.stock_qty != null) {
          await admin.from("products").update({
            stock_qty: Math.max(0, prod.stock_qty - item.quantity),
          }).eq("id", item.product_id);
        }
      }
    }
  }

  const updatePayload: Record<string, unknown> = {
    subtotal,
    shipping_fee: shipping,
    discount_amount: discount,
    tax_amount: tax,
    total_amount: total,
    delivery_method: deliveryMethod,
    ...(status ? { status } : {}),
    ...(paymentStatus ? { payment_status: paymentStatus } : {}),
    shipping_address: shippingAddress || null,
    admin_notes: adminNotes || null,
    payment_method: paymentMethod || null,
    total_override: totalOverride != null && Number.isFinite(totalOverride) ? totalOverride : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from("orders").update(updatePayload).eq("id", orderId);
  // Tolerate the migration (010) not being applied yet — retry without the new columns.
  if (error && (error.message.includes("payment_method") || error.message.includes("total_override"))) {
    const { payment_method: _pm, total_override: _to, ...legacyPayload } = updatePayload;
    await admin.from("orders").update(legacyPayload).eq("id", orderId);
  }
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

// Upload a QuickBooks invoice PDF to public storage and return its URL. The bucket is
// created on first use so no manual Supabase setup is needed.
async function saveInvoicePdf(file: File, orderId: string) {
  if (file.type !== "application/pdf") throw new Error("Please upload a PDF file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("PDF must be under 10 MB.");
  const admin = createSupabaseAdminClient();
  await admin.storage.createBucket("invoices", { public: true }).catch(() => {}); // ignore "already exists"
  const safeName = `${orderId}-${Date.now()}.pdf`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("invoices").upload(safeName, bytes, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw new Error(`Invoice upload failed: ${error.message}`);
  const { data: { publicUrl } } = admin.storage.from("invoices").getPublicUrl(safeName);
  return publicUrl;
}

// Record (or clear) a QuickBooks invoice reference for an order. Stored in the existing
// invoices table (one row per order) so admins can keep the QB invoice number + PDF
// attached to the order. The uploaded PDF (or pasted link) is shown to the customer.
// This does not call QuickBooks — it's a manual reference.
export async function saveInvoiceRefAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const orderId = String(formData.get("order_id") || "");
  if (!orderId) return;
  const invoiceNumber = String(formData.get("invoice_number") || "").trim();
  let pdfUrl = String(formData.get("pdf_url") || "").trim() || null;

  const pdfFile = formData.get("pdf_file");
  if (pdfFile instanceof File && pdfFile.size > 0) {
    try {
      pdfUrl = await saveInvoicePdf(pdfFile, orderId);
    } catch (err) {
      console.error("[saveInvoiceRefAction] pdf upload failed:", errorMessage(err));
      redirect(`/admin/orders/${orderId}?invoice_error=1`);
    }
  }

  if (!invoiceNumber && !pdfUrl) {
    await admin.from("invoices").delete().eq("order_id", orderId);
  } else {
    await admin.from("invoices").upsert(
      // invoice_number is required + unique; fall back to the order id when only a PDF is given.
      { order_id: orderId, invoice_number: invoiceNumber || `ORD-${orderId.slice(0, 8).toUpperCase()}`, pdf_url: pdfUrl },
      { onConflict: "order_id" }
    );
  }
  revalidatePath(`/admin/orders/${orderId}`);
}

// Product search for the admin order editor: add a product to an order by name or item code.
export async function searchProductsAction(query: string) {
  await requireAdmin();
  const term = query.trim();
  if (term.length < 2) return [];
  const admin = createSupabaseAdminClient();
  const pattern = `%${term.replace(/[%_]/g, "\\$&")}%`;
  const { data } = await admin
    .from("products")
    .select("id, name, sku, unit_price, image_url")
    .or(`name.ilike.${pattern},sku.ilike.${pattern}`)
    .eq("is_hidden", false)
    .order("name")
    .limit(10);
  return (data || []).map((p) => ({
    id: p.id as string,
    name: (p.name as string) || "",
    sku: (p.sku as string) || "",
    unit_price: p.unit_price != null ? Number(p.unit_price) : 0,
    image_url: (p.image_url as string) || null,
  }));
}

// Shared by approveOrderAction and createPaymentLinkAction: sends the customer a payment
// request using whichever method the admin recorded on the order (payment_method field),
// defaulting to Stripe when it's blank. Requires a confirmed shipping cost for Shipping
// orders — a picked shipping fee of exactly $0 is fine, but an unset one blocks sending.
async function sendOrderPaymentRequest(orderId: string): Promise<{ error: string } | { success: true; paymentLink: string | null }> {
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin.from("orders").select("*, profiles(email, business_name)").eq("id", orderId).single();
  if (!order) return { error: "We could not find this order. It may have been removed or you may need to refresh the page." };
  if (!order.profiles?.email) return { error: "This customer has no email on file." };
  if (Number(order.total_amount) <= 0) {
    return { error: "Enter a final order total greater than $0 before sending a payment request." };
  }
  if (order.delivery_method === "Shipping" && order.shipping_fee == null) {
    return { error: "Enter a shipping cost (0 if free) before sending a payment request for a Shipping order." };
  }

  const email = order.profiles.email as string;
  const businessName = (order.profiles.business_name as string) || email;
  const method = String(order.payment_method || "").trim();
  const amountDue = formatMoney(Number(order.total_amount));

  let paymentLink: string | null = null;
  let sessionId: string | null = null;
  let subject: string;
  let html: string;

  if (method === "E-Transfer") {
    subject = "Your order is approved — pay by e-Transfer";
    html = eTransferPaymentEmail(businessName, order.id, amountDue);
  } else if (method === "Card by Text") {
    subject = "Your order is approved — pay by card";
    html = cardByTextPaymentEmail(businessName, order.id, amountDue);
  } else if (method && method !== "Stripe") {
    subject = "Your order is approved — payment details";
    html = manualPaymentEmail(businessName, order.id, amountDue, method);
  } else {
    paymentLink = `${siteUrl()}/account/orders/${orderId}`;
    if (process.env.STRIPE_SECRET_KEY) {
      const session = await createOrderCheckoutSession({
        id: order.id,
        total_amount: Number(order.total_amount),
        customer_email: email,
      });
      paymentLink = session.url || paymentLink;
      sessionId = session.id;
    }
    subject = "Your order is approved — pay now";
    html = paymentLinkEmail(businessName, order.id, paymentLink, siteUrl());
  }

  await admin.from("orders").update({
    status: "Payment Link Sent",
    payment_status: "Payment Link Sent",
    stripe_payment_link: paymentLink,
    stripe_session_id: sessionId,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);

  await sendEmail({ to: email, subject, html });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, paymentLink };
}

export async function approveOrderAction(orderId: string) {
  await requireAdmin();
  const result = await sendOrderPaymentRequest(orderId);
  if ("error" in result) redirect(`/admin/orders/${orderId}?order_error=${encodeURIComponent(result.error)}`);
}

export async function createPaymentLinkAction(orderId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin.from("orders").select("status").eq("id", orderId).single();
  if (!order) redirect(`/admin/orders/${orderId}`);
  if (!["Approved", "Payment Link Sent"].includes(order.status)) {
    redirect(`/admin/orders/${orderId}?order_error=${encodeURIComponent("Approve this order before creating a payment link.")}`);
  }
  const result = await sendOrderPaymentRequest(orderId);
  if ("error" in result) redirect(`/admin/orders/${orderId}?order_error=${encodeURIComponent(result.error)}`);
}

export async function approveB2BCustomerAction(customerId: string, approved: boolean) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  // When approving, also clear b2b_declined so the account doesn't appear in
  // both "Approved" and "Declined" lists simultaneously.
  await admin.from("profiles").update({
    is_b2b_approved: approved,
    ...(approved ? { b2b_declined: false } : {}),
  }).eq("id", customerId);

  const { data: profile } = await admin.from("profiles").select("email, business_name, contact_name").eq("id", customerId).single();
  if (profile?.email) {
    if (approved) {
      await sendEmail({
        to: profile.email,
        subject: "Your B2B account has been approved — Butterfly Fashion",
        html: b2bApprovedEmail(profile.contact_name || profile.business_name, siteUrl()),
      });
    } else {
      await sendEmail({
        to: profile.email,
        subject: "Your B2B account application update",
        html: b2bRejectedEmail(profile.contact_name || profile.business_name),
      });
    }
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function deleteCustomerAction(customerId: string) {
  const currentAdmin = await requireAdmin();
  if (currentAdmin.id === customerId) redirect("/admin/customers?error=self-delete");

  const admin = createSupabaseAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("id, role, auth_user_id")
    .eq("id", customerId)
    .single();
  if (!target) redirect("/admin/customers?error=not-found");
  if (target.role === "admin") redirect(`/admin/customers/${customerId}?error=is-admin`);

  // Force delete: remove this customer's orders and quotes first. orders.customer_id is
  // ON DELETE RESTRICT, so the profile cannot be deleted while orders exist. order_items,
  // quote_items, and invoices cascade from their parent rows.
  await admin.from("orders").delete().eq("customer_id", customerId);
  await admin.from("quotes").delete().eq("customer_id", customerId);

  // Clean up other rows that reference this profile.
  // customer_prices cascade automatically when the profile row is deleted.
  await admin.from("b2b_messages").delete().eq("profile_id", customerId);
  await admin.from("preorder_commitments").delete().eq("customer_id", customerId);

  // Deleting the auth user cascades to the profile row (and customer_prices).
  if (target.auth_user_id) {
    const { error } = await admin.auth.admin.deleteUser(target.auth_user_id);
    if (error) redirect(`/admin/customers/${customerId}?error=delete-failed`);
  } else {
    await admin.from("profiles").delete().eq("id", customerId);
  }

  revalidatePath("/admin/customers");
  redirect("/admin/customers?status=deleted");
}

export async function promoteAdminByEmailAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect("/admin/admins?error=missing-email");

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id,email,role")
    .ilike("email", email)
    .maybeSingle();

  if (!profile) redirect("/admin/admins?error=user-not-found");
  if (profile.role === "admin") redirect("/admin/admins?status=already-admin");

  await admin
    .from("profiles")
    .update({ role: "admin", updated_at: new Date().toISOString() })
    .eq("id", profile.id);

  revalidatePath("/admin/admins");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${profile.id}`);
  redirect("/admin/admins?status=promoted");
}

export async function removeAdminRoleAction(profileId: string) {
  const currentAdmin = await requireAdmin();
  if (currentAdmin.id === profileId) redirect("/admin/admins?error=self-demote");

  const admin = createSupabaseAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");

  if ((count || 0) <= 1) redirect("/admin/admins?error=last-admin");

  await admin
    .from("profiles")
    .update({ role: "customer", updated_at: new Date().toISOString() })
    .eq("id", profileId);

  revalidatePath("/admin/admins");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${profileId}`);
  redirect("/admin/admins?status=removed");
}

export async function upsertProductAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  // Top-level catch: convert any unhandled error into a visible message
  // instead of crashing the page. Re-throw Next.js internal errors (redirect, not-found).
  try {
    return await _upsertProductActionInner(formData);
  } catch (err: unknown) {
    // Re-throw Next.js special errors (redirect / not-found / etc.)
    if (err && typeof err === "object" && "digest" in err) throw err;
    const msg = errorMessage(err);
    console.error("[upsertProductAction] unhandled error:", msg);
    return { error: `Unexpected error: ${msg}. Please try again or contact support.` };
  }
}

async function _upsertProductActionInner(formData: FormData): Promise<{ error: string } | null> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();

  if (!name) return { error: "Product name is required." };
  if (!category) return { error: "Please select a category. If none exist, add one in Admin → Categories first." };

  const requestedSlug = String(formData.get("slug") || "").trim();
  const requestedSku = String(formData.get("sku") || "").trim();
  const slugBase = slugify(requestedSlug || name);
  const slug = await uniqueProductValue(admin, "slug", slugBase, id || undefined);
  const skuBase = requestedSku || `WFG-${skuPrefixForCategory(category)}-${slug.replace(/-/g, "-").toUpperCase().slice(0, 48)}`;
  const sku = await uniqueProductValue(admin, "sku", skuBase, id || undefined);
  const imageFile = formData.get("image_file");
  let uploadedImageUrl: string | null = null;
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      uploadedImageUrl = await saveProductImage(imageFile, slug);
    } catch (err) {
      console.error("[product image upload failed]", err);
    }
  }

  // Additional images: up to 9 extra slots
  const additionalImages: string[] = [];
  for (let i = 0; i < 9; i++) {
    const extraFile = formData.get(`image_file_extra_${i}`);
    const existingUrl = String(formData.get(`image_url_extra_${i}`) || "").trim();
    if (extraFile instanceof File && extraFile.size > 0) {
      try {
        const url = await saveProductImage(extraFile, `${slug}-extra-${i}`);
        if (url) additionalImages.push(url);
      } catch (err) {
        console.error(`[extra image ${i} upload failed]`, err);
        if (existingUrl) additionalImages.push(existingUrl);
      }
    } else if (existingUrl) {
      additionalImages.push(existingUrl);
    }
  }

  const rawWeightKg = formData.get("weight_kg");
  const rawBoxL = formData.get("box_length_cm");
  const rawBoxW = formData.get("box_width_cm");
  const rawBoxH = formData.get("box_height_cm");
  const rawStockQty = formData.get("stock_qty");
  const salesChannels = [
    formData.get("sales_channel_b2b") === "on" ? "b2b" : null,
    formData.get("sales_channel_b2c") === "on" ? "b2c" : null,
  ].filter((channel): channel is "b2b" | "b2c" => Boolean(channel));

  const unitPrice = Number(formData.get("unit_price") || 0);
  const rawCasePrice = formData.get("case_price");
  const rawCaseQty = formData.get("case_qty");

  const payload = {
    name,
    slug,
    description: String(formData.get("description") || ""),
    sku,
    barcode: String(formData.get("barcode") || "") || null,
    unit_price: unitPrice,
    price: unitPrice,
    case_price: rawCasePrice ? Number(rawCasePrice) : null,
    case_qty: rawCaseQty ? Number(rawCaseQty) : null,
    image_url: uploadedImageUrl || String(formData.get("image_url") || "") || null,
    additional_images: additionalImages,
    options: (() => { try { return JSON.parse(String(formData.get("options_json") || "[]")); } catch { return []; } })(),
    variants: (() => { try { return JSON.parse(String(formData.get("variants_json") || "[]")); } catch { return []; } })(),
    internal_notes: String(formData.get("internal_notes") || "") || null,
    category,
    availability_status: String(formData.get("availability_status") || "Manual Confirm"),
    is_bulk_available: formData.get("is_bulk_available") === "on",
    is_hidden: formData.get("is_hidden") === "on",
    sales_channels: salesChannels.length ? salesChannels : ["b2b"],
    weight_kg: rawWeightKg ? Number(rawWeightKg) : null,
    box_length_cm: rawBoxL ? Number(rawBoxL) : null,
    box_width_cm: rawBoxW ? Number(rawBoxW) : null,
    box_height_cm: rawBoxH ? Number(rawBoxH) : null,
    stock_qty: rawStockQty ? Number(rawStockQty) : null,
    country: String(formData.get("country") || "") || null,
    lead_time: String(formData.get("lead_time") || "") || null,
    updated_at: new Date().toISOString(),
  };
  try {
    const query = id
      ? admin.from("products").update(payload).eq("id", id)
      : admin.from("products").insert(payload);
    const { error } = await query;
    if (error) throw error;
  } catch (err) {
    const msg = errorMessage(err);
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return { error: "A product with this slug or SKU already exists. Try a different name or clear the System IDs fields to auto-generate." };
    }
    return { error: `Failed to save product: ${msg}` };
  }
  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function setCustomerPriceAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const customerId = String(formData.get("customer_id"));
  const productId = String(formData.get("product_id"));
  const unitPrice = Number(formData.get("unit_price") || formData.get("price") || 0);
  const rawCasePrice = formData.get("case_price");
  const casePrice = rawCasePrice ? Number(rawCasePrice) : null;

  await admin.from("customer_prices").upsert({
    customer_id: customerId,
    product_id: productId,
    price: unitPrice,
    unit_price: unitPrice,
    case_price: casePrice,
    min_quantity: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "customer_id,product_id,min_quantity" });
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function createPreorderCampaignAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "");
  const rawClosesAt = formData.get("closes_at");

  if (!title) return;

  // A campaign is now a container; products are added on the detail page.
  const { data: campaign, error } = await admin
    .from("preorder_campaigns")
    .insert({
      title,
      description,
      status: "open",
      closes_at: rawClosesAt ? new Date(String(rawClosesAt)).toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !campaign) return;

  revalidatePath("/admin/preorders");
  redirect(`/admin/preorders/${campaign.id}`);
}

export async function addPreorderItemAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const campaignId = String(formData.get("campaign_id") || "");
  const productId = String(formData.get("product_id") || "");
  const unitPrice = Number(formData.get("unit_price") || 0);
  const rawCasePrice = formData.get("case_price");
  const rawCaseQty = formData.get("case_qty");
  if (!campaignId || !productId) return;

  await admin.from("preorder_campaign_items").upsert(
    {
      campaign_id: campaignId,
      product_id: productId,
      unit_price: unitPrice,
      case_price: rawCasePrice ? Number(rawCasePrice) : null,
      case_qty: rawCaseQty ? Number(rawCaseQty) : null,
    },
    { onConflict: "campaign_id,product_id" }
  );
  revalidatePath(`/admin/preorders/${campaignId}`);
}

export async function deletePreorderItemAction(itemId: string, campaignId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("preorder_campaign_items").delete().eq("id", itemId);
  revalidatePath(`/admin/preorders/${campaignId}`);
}

export async function updatePreorderCampaignAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const campaignId = String(formData.get("campaign_id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "");
  const rawClosesAt = formData.get("closes_at");
  if (!campaignId || !title) return;
  await admin.from("preorder_campaigns").update({
    title,
    description,
    closes_at: rawClosesAt ? new Date(String(rawClosesAt)).toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", campaignId);
  revalidatePath(`/admin/preorders/${campaignId}`);
  revalidatePath("/admin/preorders");
}

export async function updatePreorderCampaignStatusAction(campaignId: string, status: "open" | "closed" | "cancelled") {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("preorder_campaigns").update({
    status,
    updated_at: new Date().toISOString(),
  }).eq("id", campaignId);
  revalidatePath("/admin/preorders");
  revalidatePath(`/admin/preorders/${campaignId}`);
}

export async function submitPreorderCommitmentAction(formData: FormData) {
  const profile = await requireProfile();
  // Service-role client (auth enforced by requireProfile). The commitment upsert keys on
  // customer_id = profile.id, so it can't write to another account; using the user-session
  // client here risked the same RLS denial as the order flow on a mid-request token refresh.
  const supabase = createSupabaseAdminClient();
  const campaignId = String(formData.get("campaign_id") || "");
  const productId = String(formData.get("product_id") || "") || null;
  const cases = Math.max(1, Number(formData.get("cases") || 1));
  const caseQtyInput = Number(formData.get("case_qty") || 0);

  const { data: campaign } = await supabase
    .from("preorder_campaigns")
    .select("id, status")
    .eq("id", campaignId)
    .single();

  if (!campaign || campaign.status !== "open") return;

  const caseQty = caseQtyInput > 0 ? caseQtyInput : 12;
  const quantity = cases * caseQty;

  await supabase.from("preorder_commitments").upsert({
    campaign_id: campaignId,
    customer_id: profile.id,
    product_id: productId,
    quantity,
    updated_at: new Date().toISOString(),
  }, { onConflict: "campaign_id,customer_id,product_id" });

  revalidatePath("/preorders");
}

export async function respondQuoteAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const quoteId = String(formData.get("quote_id"));
  await admin.from("quotes").update({
    status: String(formData.get("status") || "Responded"),
    admin_response: String(formData.get("admin_response") || ""),
    updated_at: new Date().toISOString(),
  }).eq("id", quoteId);
  revalidatePath("/admin/quotes");
}

export async function declineB2BAccountAction(customerId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("profiles").update({ b2b_declined: true, is_b2b_approved: false }).eq("id", customerId);
  const { data: profile } = await admin.from("profiles").select("email, business_name, contact_name").eq("id", customerId).single();
  if (profile?.email) {
    await sendEmail({
      to: profile.email,
      subject: "Your B2B account application update",
      html: b2bRejectedEmail(profile.contact_name || profile.business_name),
    });
  }
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/customers");
}

export async function deleteProductAction(productId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { count } = await admin.from("order_items").select("*", { count: "exact", head: true }).eq("product_id", productId);
  if (count && count > 0) {
    // Has order history — hide instead of delete to preserve records
    await admin.from("products").update({ is_hidden: true }).eq("id", productId);
  } else {
    await admin.from("products").delete().eq("id", productId);
  }
  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function duplicateProductAction(productId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { data: original } = await admin.from("products").select("*").eq("id", productId).single();
  if (!original) return;
  const slug = await uniqueProductValue(admin, "slug", slugify(`${original.name}-copy`));
  const sku = await uniqueProductValue(admin, "sku", `${original.sku}-COPY`);
  const { data: newProduct } = await admin.from("products").insert({
    name: `${original.name} (Copy)`,
    slug, sku,
    description: original.description,
    barcode: null,
    unit_price: original.unit_price,
    case_price: original.case_price,
    case_qty: original.case_qty,
    image_url: original.image_url,
    category: original.category,
    sales_channels: original.sales_channels?.length ? original.sales_channels : ["b2b"],
    availability_status: original.availability_status,
    is_bulk_available: original.is_bulk_available,
    is_hidden: true,
    weight_kg: original.weight_kg,
    box_length_cm: original.box_length_cm,
    box_width_cm: original.box_width_cm,
    box_height_cm: original.box_height_cm,
    stock_qty: null,
    country: original.country,
    lead_time: original.lead_time,
    updated_at: new Date().toISOString(),
  }).select().single();
  revalidatePath("/admin/products");
  if (newProduct) redirect(`/admin/products/${newProduct.id}`);
}

export async function cancelOrderAction(orderId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("orders").update({ status: "Cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId).neq("status", "Paid");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function deleteCustomerPriceAction(priceId: string, customerId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("customer_prices").delete().eq("id", priceId);
  revalidatePath(`/admin/customers/${customerId}`);
}

// ── CS Messaging ───────────────────────────────────────────────────────────────

// Fire-and-forget email to the store admin when a customer sends a message.
// Content is intentionally omitted — the alert just says who messaged + a link.
async function notifyAdminOfMessage(businessName: string, profileId: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  try {
    await sendEmail({
      to: adminEmail,
      subject: `New customer message — ${businessName}`,
      html: adminNewMessageEmail(businessName, profileId, siteUrl()),
    });
  } catch (err) {
    console.error("notifyAdminOfMessage failed:", errorMessage(err));
  }
}

export async function sendCustomerMessageAction(formData: FormData) {
  const profile = await requireProfile();
  const content = String(formData.get("content") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim() || null;
  if (!content && !imageUrl) return;
  // Service-role client (auth enforced by requireProfile). profile_id is the authenticated
  // profile.id, so a user can't post into another thread; avoids the RLS token-refresh race.
  const supabase = createSupabaseAdminClient();
  await supabase.from("b2b_messages").insert({
    profile_id: profile.id,
    content: content || "",
    image_url: imageUrl,
    is_from_admin: false,
    is_read: false,
  });
  await notifyAdminOfMessage(profile.business_name || profile.contact_name, profile.id);
  revalidatePath("/account/messages");
}

// Called by the floating chat widget, which inserts the message client-side.
// Derives the profile from the session so the caller can't spoof another account.
export async function notifyAdminNewMessageAction() {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false };
  await notifyAdminOfMessage(profile.business_name || profile.contact_name, profile.id);
  return { ok: true };
}

export async function adminReplyMessageAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const profileId = String(formData.get("profile_id") || "");
  const content = String(formData.get("content") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim() || null;
  if ((!content && !imageUrl) || !profileId) return;
  await admin.from("b2b_messages").insert({
    profile_id: profileId,
    content: content || "",
    image_url: imageUrl,
    is_from_admin: true,
    is_read: true,
  });
  // Mark all customer messages in this thread as read
  await admin
    .from("b2b_messages")
    .update({ is_read: true })
    .eq("profile_id", profileId)
    .eq("is_from_admin", false);
  revalidatePath(`/admin/messages/${profileId}`);
  revalidatePath("/admin/messages");
}

export async function markMessagesReadAction(profileId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin
    .from("b2b_messages")
    .update({ is_read: true })
    .eq("profile_id", profileId)
    .eq("is_from_admin", false);
  revalidatePath("/admin/messages");
}

export async function deleteQuoteAction(quoteId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("quotes").delete().eq("id", quoteId);
  revalidatePath("/admin/quotes");
}

// ── Lookbook ────────────────────────────────────────────────────────────────

async function saveLookbookImage(file: File, itemId: string) {
  if (!file.size) return null;
  if (!file.type.startsWith("image/")) throw new Error("Please upload a valid image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB.");
  const ext = (file.name.split(".").pop()?.toLowerCase() || "jpg").replace(/[^a-z0-9]/g, "");
  const safeName = `${itemId}-${Date.now()}.${ext}`;
  const admin = createSupabaseAdminClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("lookbook-images").upload(safeName, bytes, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data: { publicUrl } } = admin.storage.from("lookbook-images").getPublicUrl(safeName);
  return publicUrl;
}

export async function createLookbookItemAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const season = String(formData.get("season") || "").trim() || null;
  const linkedProductSlug = String(formData.get("linked_product_slug") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const isPublished = formData.get("is_published") === "true";
  if (!title) return { error: "Title is required." };

  const itemId = crypto.randomUUID();
  const imageFile = formData.get("image") as File | null;
  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await saveLookbookImage(imageFile, itemId);
    } catch (err) {
      return { error: errorMessage(err) };
    }
  }
  if (!imageUrl) return { error: "An image is required." };

  const { error } = await admin.from("lookbook_items").insert({
    id: itemId, title, description, image_url: imageUrl,
    season, linked_product_slug: linkedProductSlug,
    sort_order: sortOrder, is_published: isPublished,
  });
  if (error) return { error: `Failed to save: ${error.message}` };
  revalidatePath("/admin/lookbook");
  revalidatePath("/lookbook");
  redirect("/admin/lookbook");
}

export async function updateLookbookItemAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const itemId = String(formData.get("item_id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const season = String(formData.get("season") || "").trim() || null;
  const linkedProductSlug = String(formData.get("linked_product_slug") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const isPublished = formData.get("is_published") === "true";
  if (!itemId || !title) return;

  const imageFile = formData.get("image") as File | null;
  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await saveLookbookImage(imageFile, itemId);
    } catch (err) {
      return { error: errorMessage(err) };
    }
  }

  const payload: Record<string, unknown> = { title, description, season, linked_product_slug: linkedProductSlug, sort_order: sortOrder, is_published: isPublished };
  if (imageUrl) payload.image_url = imageUrl;

  await admin.from("lookbook_items").update(payload).eq("id", itemId);
  revalidatePath("/admin/lookbook");
  revalidatePath("/lookbook");
  redirect("/admin/lookbook");
}

export async function deleteLookbookItemAction(itemId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("lookbook_items").delete().eq("id", itemId);
  revalidatePath("/admin/lookbook");
  revalidatePath("/lookbook");
}

export async function toggleLookbookPublishedAction(itemId: string, isPublished: boolean) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("lookbook_items").update({ is_published: isPublished }).eq("id", itemId);
  revalidatePath("/admin/lookbook");
  revalidatePath("/lookbook");
}

// ── Hero banners ─────────────────────────────────────────────────────────────

async function saveHeroBannerImage(file: File, bannerId: string) {
  if (!file.size) return null;
  if (!file.type.startsWith("image/")) throw new Error("Please upload a valid image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB.");
  const ext = (file.name.split(".").pop()?.toLowerCase() || "jpg").replace(/[^a-z0-9]/g, "");
  const safeName = `${bannerId}-${Date.now()}.${ext}`;
  const admin = createSupabaseAdminClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("hero-banners").upload(safeName, bytes, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data: { publicUrl } } = admin.storage.from("hero-banners").getPublicUrl(safeName);
  return publicUrl;
}

export async function createHeroBannerAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const title = String(formData.get("title") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim() || null;
  const linkUrl = String(formData.get("link_url") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const isPublished = formData.get("is_published") === "true";
  if (!title) return { error: "Title is required." };

  const bannerId = crypto.randomUUID();
  const imageFile = formData.get("image") as File | null;
  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await saveHeroBannerImage(imageFile, bannerId);
    } catch (err) {
      return { error: errorMessage(err) };
    }
  }
  if (!imageUrl) return { error: "An image is required." };

  const { error } = await admin.from("hero_banners").insert({
    id: bannerId, title, subtitle, image_url: imageUrl,
    link_url: linkUrl, sort_order: sortOrder, is_published: isPublished,
  });
  if (error) return { error: `Failed to save: ${error.message}` };
  revalidatePath("/admin/hero");
  revalidatePath("/");
  redirect("/admin/hero");
}

export async function updateHeroBannerAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const bannerId = String(formData.get("banner_id") || "");
  const title = String(formData.get("title") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim() || null;
  const linkUrl = String(formData.get("link_url") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const isPublished = formData.get("is_published") === "true";
  if (!bannerId || !title) return;

  const imageFile = formData.get("image") as File | null;
  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await saveHeroBannerImage(imageFile, bannerId);
    } catch (err) {
      return { error: errorMessage(err) };
    }
  }

  const payload: Record<string, unknown> = { title, subtitle, link_url: linkUrl, sort_order: sortOrder, is_published: isPublished };
  if (imageUrl) payload.image_url = imageUrl;

  await admin.from("hero_banners").update(payload).eq("id", bannerId);
  revalidatePath("/admin/hero");
  revalidatePath("/");
  redirect("/admin/hero");
}

export async function deleteHeroBannerAction(bannerId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("hero_banners").delete().eq("id", bannerId);
  revalidatePath("/admin/hero");
  revalidatePath("/");
}

export async function toggleHeroBannerPublishedAction(bannerId: string, isPublished: boolean) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("hero_banners").update({ is_published: isPublished }).eq("id", bannerId);
  revalidatePath("/admin/hero");
  revalidatePath("/");
}

// ── Blog ─────────────────────────────────────────────────────────────────────

async function saveBlogImage(file: File, slug: string) {
  if (!file.size) return null;
  if (!file.type.startsWith("image/")) throw new Error("Please upload a valid image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB.");
  const ext = (file.name.split(".").pop()?.toLowerCase() || "jpg").replace(/[^a-z0-9]/g, "");
  const safeName = `blog-${slug}-${Date.now()}.${ext}`;
  const admin = createSupabaseAdminClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("product-images").upload(safeName, bytes, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data: { publicUrl } } = admin.storage.from("product-images").getPublicUrl(safeName);
  return publicUrl;
}

async function uniqueBlogSlug(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  base: string,
  currentId?: string
) {
  const clean = base || `post-${Date.now()}`;
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? clean : `${clean}-${i + 1}`;
    let query = admin.from("blog_posts").select("id").eq("slug", candidate);
    if (currentId) query = query.neq("id", currentId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
  }
  return `${clean}-${Date.now()}`;
}

type BlogState = { error?: string } | null;

export async function createBlogPostAction(_prev: BlogState, formData: FormData): Promise<BlogState> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Title is required." };

  const slug = await uniqueBlogSlug(admin, slugify(String(formData.get("slug") || "").trim() || title));
  const status = formData.get("status") === "published" ? "published" : "draft";

  let coverUrl = String(formData.get("cover_image_url") || "") || null;
  const cover = formData.get("cover_image");
  if (cover instanceof File && cover.size > 0) {
    try { coverUrl = await saveBlogImage(cover, slug); } catch (err) { return { error: errorMessage(err) }; }
  }

  const { error } = await admin.from("blog_posts").insert({
    slug,
    title,
    excerpt: String(formData.get("excerpt") || "") || null,
    body_html: String(formData.get("body_html") || ""),
    cover_image_url: coverUrl,
    category: String(formData.get("category") || "") || null,
    meta_description: String(formData.get("meta_description") || "") || null,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  });
  if (error) return { error: `Failed to save: ${error.message}` };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function updateBlogPostAction(_prev: BlogState, formData: FormData): Promise<BlogState> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const id = String(formData.get("post_id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!id || !title) return { error: "Title is required." };

  const { data: existing } = await admin.from("blog_posts").select("status, cover_image_url").eq("id", id).single();
  const slug = await uniqueBlogSlug(admin, slugify(String(formData.get("slug") || "").trim() || title), id);
  const status = formData.get("status") === "published" ? "published" : "draft";

  let coverUrl = existing?.cover_image_url ?? null;
  const cover = formData.get("cover_image");
  if (cover instanceof File && cover.size > 0) {
    try { coverUrl = await saveBlogImage(cover, slug); } catch (err) { return { error: errorMessage(err) }; }
  }

  const payload: Record<string, unknown> = {
    slug,
    title,
    excerpt: String(formData.get("excerpt") || "") || null,
    body_html: String(formData.get("body_html") || ""),
    cover_image_url: coverUrl,
    category: String(formData.get("category") || "") || null,
    meta_description: String(formData.get("meta_description") || "") || null,
    status,
    updated_at: new Date().toISOString(),
  };
  // Stamp published_at the first time it goes live.
  if (status === "published" && existing?.status !== "published") {
    payload.published_at = new Date().toISOString();
  }

  const { error } = await admin.from("blog_posts").update(payload).eq("id", id);
  if (error) return { error: `Failed to save: ${error.message}` };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  redirect("/admin/blog");
}

export async function deleteBlogPostAction(id: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("blog_posts").delete().eq("id", id);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function toggleBlogPublishedAction(id: string, publish: boolean) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("blog_posts").update({
    status: publish ? "published" : "draft",
    ...(publish ? { published_at: new Date().toISOString() } : {}),
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

// ── Category CRUD ──────────────────────────────────────────────────────────────

function slugifyCategory(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const name = String(formData.get("name") || "").trim();
  const rawParentId = String(formData.get("parent_id") || "").trim();
  const parentId = rawParentId || null;
  if (!name) return;
  const slug = slugifyCategory(name);
  const { data: last } = await admin.from("b2b_categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).single();
  await admin.from("b2b_categories").insert({ name, slug, sort_order: (last?.sort_order ?? 0) + 1, parent_id: parentId });
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function setCategoryParentAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const id = String(formData.get("id") || "");
  const rawParentId = String(formData.get("parent_id") || "").trim();
  const parentId = rawParentId || null;
  if (!id) return;
  await admin.from("b2b_categories").update({ parent_id: parentId, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function renameCategoryAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) return;
  await admin.from("b2b_categories").update({ name, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function toggleCategoryAction(id: string, isActive: boolean) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("b2b_categories").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("b2b_categories").delete().eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function moveCategoryAction(id: string, direction: "up" | "down") {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { data: all } = await admin.from("b2b_categories").select("id, sort_order").order("sort_order");
  if (!all?.length) return;
  const idx = all.findIndex((c) => c.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return;
  const current = all[idx];
  const swap = all[swapIdx];
  await Promise.all([
    admin.from("b2b_categories").update({ sort_order: swap.sort_order }).eq("id", current.id),
    admin.from("b2b_categories").update({ sort_order: current.sort_order }).eq("id", swap.id),
  ]);
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
}
