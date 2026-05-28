"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateTotals } from "@/lib/money";
import {
  sendEmail, emailHtml,
  registrationEmail, orderReceivedEmail, adminNewOrderEmail,
  paymentLinkEmail, b2bApprovedEmail, b2bRejectedEmail,
} from "@/lib/email";
import { createOrderCheckoutSession } from "@/lib/stripe";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin, requireProfile } from "@/lib/auth";
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
    return "Please confirm your email address before signing in.";
  }
  if (text.includes("user already registered") || text.includes("already exists")) {
    return "An account with this email already exists. Please sign in or use a different email.";
  }
  if (text.includes("password")) {
    return "Please choose a stronger password and try again.";
  }
  if (text.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
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
    phone: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(5, "Please enter a valid phone number.").optional()),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm_password: z.string().min(8, "Please confirm your password."),
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

export async function registerAction(_prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const safeValues = { ...raw, password: "", confirm_password: "", _ts: Date.now().toString() };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Please check the highlighted account details and try again.", values: safeValues };

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) return { error: friendlyAuthError(error?.message), values: safeValues };

  const { error: profileError } = await admin.from("profiles").insert({
    auth_user_id: data.user.id,
    role: "customer",
    business_name: parsed.data.business_name,
    contact_name: parsed.data.contact_name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    business_address: parsed.data.business_address,
    city: parsed.data.city,
    province: parsed.data.province,
    postal_code: parsed.data.postal_code,
    country: parsed.data.country,
    business_type: parsed.data.business_type,
    is_b2b_approved: false,
    tax_number: parsed.data.tax_number || null,
    website: parsed.data.website || null,
    notes: parsed.data.notes || null,
    preferred_delivery_method: parsed.data.preferred_delivery_method || null,
  });
  if (profileError) {
    return { error: friendlyDatabaseError("create your account", profileError.message), values: safeValues };
  }

  await sendEmail({
    to: parsed.data.email,
    subject: "Butterfly Fashion Trading — account created",
    html: registrationEmail(parsed.data.contact_name || parsed.data.business_name, siteUrl()),
  });

  redirect("/login?registered=1");
}

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendlyAuthError(error.message) };
  redirect("/");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") || "");
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/reset-password`,
  });
  return { success: "If an account exists, password reset instructions will be sent." };
}

export async function resetPasswordAction(_prevState: unknown, formData: FormData) {
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
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
  const supabase = await createSupabaseServerClient();

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
  const totals = calculateTotals(itemSnapshots.map((item) => ({ quantity: item.quantity, unitPrice: item.unitPrice })));

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: profile.id,
      status: "Pending Review",
      payment_status: "Unpaid",
      subtotal: totals.subtotal,
      shipping_fee: 0,
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

export async function updateOrderReviewAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const orderId = String(formData.get("order_id"));
  const shipping = Number(formData.get("shipping_fee") || 0);
  const discount = Number(formData.get("discount_amount") || 0);
  const tax = Number(formData.get("tax_amount") || 0);
  const adminNotes = String(formData.get("admin_notes") || "");
  const deliveryMethod = String(formData.get("delivery_method")) as "Pickup" | "Shipping";
  const status = String(formData.get("status") || "");
  const paymentStatus = String(formData.get("payment_status") || "");
  const shippingAddress = String(formData.get("shipping_address") || "");

  const { data: items } = await admin.from("order_items").select("*").eq("order_id", orderId);
  const updatedItems = (items || []).map((item) => {
    const quantity = Math.max(1, Number(formData.get(`quantity_${item.id}`) || item.quantity));
    const unitPrice = Number(formData.get(`unit_price_${item.id}`) || item.unit_price_snapshot);
    return { ...item, quantity, unit_price_snapshot: unitPrice, line_total: Number((quantity * unitPrice).toFixed(2)) };
  });
  for (const item of updatedItems) {
    await admin.from("order_items").update({
      quantity: item.quantity,
      unit_price_snapshot: item.unit_price_snapshot,
      line_total: item.line_total,
    }).eq("id", item.id);
  }
  const subtotal = updatedItems.reduce((sum, item) => sum + Number(item.line_total), 0);
  const total = subtotal - discount + shipping + tax;

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

  await admin.from("orders").update({
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
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function approveOrderAction(orderId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin.from("orders").select("*, profiles(email)").eq("id", orderId).single();
  if (!order) return;

  if (process.env.STRIPE_SECRET_KEY && Number(order.total_amount) > 0 && order.profiles?.email) {
    const session = await createOrderCheckoutSession({
      id: order.id,
      total_amount: Number(order.total_amount),
      customer_email: order.profiles.email,
    });
    const paymentLink = session.url || `${siteUrl()}/account/orders/${orderId}`;
    await admin.from("orders").update({
      status: "Payment Link Sent",
      payment_status: "Payment Link Sent",
      stripe_payment_link: paymentLink,
      stripe_session_id: session.id,
      updated_at: new Date().toISOString(),
    }).eq("id", orderId);
    await sendEmail({
      to: order.profiles.email,
      subject: "Your order is approved — pay now",
      html: paymentLinkEmail(order.profiles.business_name || order.profiles.email, order.id, paymentLink, siteUrl()),
    });
  } else {
    await admin.from("orders").update({ status: "Approved", updated_at: new Date().toISOString() }).eq("id", orderId);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function createPaymentLinkAction(orderId: string): Promise<{ error: string } | { success: true; paymentLink: string }> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin.from("orders").select("*, profiles(email)").eq("id", orderId).single();

  if (!order) return { error: "We could not find this order. It may have been removed or you may need to refresh the page." };
  if (!["Approved", "Payment Link Sent"].includes(order.status)) {
    return { error: "Approve this order before creating a payment link." };
  }
  if (Number(order.total_amount) <= 0) {
    return { error: "Enter a final order total greater than $0 before creating a payment link." };
  }

  let paymentLink = `${siteUrl()}/account/orders/${orderId}`;
  let sessionId: string | null = null;
  if (process.env.STRIPE_SECRET_KEY) {
    const session = await createOrderCheckoutSession({
      id: order.id,
      total_amount: Number(order.total_amount),
      customer_email: order.profiles.email,
    });
    paymentLink = session.url || paymentLink;
    sessionId = session.id;
  }

  await admin.from("orders").update({
    status: "Payment Link Sent",
    payment_status: "Payment Link Sent",
    stripe_payment_link: paymentLink,
    stripe_session_id: sessionId,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);

  await sendEmail({
    to: order.profiles.email,
    subject: "Your order is approved — pay now",
    html: paymentLinkEmail(order.profiles.business_name || order.profiles.email, order.id, paymentLink, siteUrl()),
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, paymentLink };
}

export async function approveB2BCustomerAction(customerId: string, approved: boolean) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("profiles").update({ is_b2b_approved: approved }).eq("id", customerId);

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

export async function createQuoteAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const productId = String(formData.get("product_id") || "");
  const quantity = Math.max(1, Number(formData.get("quantity") || 1));
  const message = String(formData.get("message") || "");
  const requestedPrice = Number(formData.get("requested_price") || 0) || null;

  const { data: quote, error } = await supabase.from("quotes").insert({
    customer_id: profile.id,
    status: "Pending",
    message,
  }).select().single();
  if (error || !quote) return;
  if (productId) {
    await supabase.from("quote_items").insert({
      quote_id: quote.id,
      product_id: productId,
      quantity,
      requested_price: requestedPrice,
    });
  }
  const quoteAdminEmail = process.env.ADMIN_EMAIL;
  if (quoteAdminEmail) {
    await sendEmail({
      to: quoteAdminEmail,
      subject: `New quote request — ${profile.business_name || profile.email}`,
      html: emailHtml("New quote request", `
        <p><strong>${profile.business_name || profile.contact_name}</strong> submitted a quote request.</p>
        ${message ? `<p style="margin-top:12px;padding:12px;background:#F9FAFB;border-radius:6px;font-size:13px;">${message}</p>` : ""}
        <p style="margin-top:16px;"><a href="${siteUrl()}/admin/quotes" style="color:#166534;font-weight:600;">View quote requests →</a></p>
      `),
    });
  }
  revalidatePath("/account/quotes");
  revalidatePath("/admin/quotes");
}

export async function upsertProductAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const requestedSlug = String(formData.get("slug") || "").trim();
  const requestedSku = String(formData.get("sku") || "").trim();
  const slugBase = slugify(requestedSlug || name);
  const slug = await uniqueProductValue(admin, "slug", slugBase, id || undefined);
  const skuBase = requestedSku || `WFG-${skuPrefixForCategory(category)}-${slug.replace(/-/g, "-").toUpperCase().slice(0, 48)}`;
  const sku = await uniqueProductValue(admin, "sku", skuBase, id || undefined);
  const imageFile = formData.get("image_file");
  const uploadedImageUrl = imageFile instanceof File && imageFile.size > 0
    ? await saveProductImage(imageFile, slug)
    : null;

  const rawWeightKg = formData.get("weight_kg");
  const rawBoxL = formData.get("box_length_cm");
  const rawBoxW = formData.get("box_width_cm");
  const rawBoxH = formData.get("box_height_cm");
  const rawStockQty = formData.get("stock_qty");

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
    case_price: rawCasePrice ? Number(rawCasePrice) : null,
    case_qty: rawCaseQty ? Number(rawCaseQty) : null,
    image_url: uploadedImageUrl || String(formData.get("image_url") || "") || null,
    category,
    availability_status: String(formData.get("availability_status") || "Manual Confirm"),
    is_bulk_available: formData.get("is_bulk_available") === "on",
    is_hidden: formData.get("is_hidden") === "on",
    weight_kg: rawWeightKg ? Number(rawWeightKg) : null,
    box_length_cm: rawBoxL ? Number(rawBoxL) : null,
    box_width_cm: rawBoxW ? Number(rawBoxW) : null,
    box_height_cm: rawBoxH ? Number(rawBoxH) : null,
    stock_qty: rawStockQty ? Number(rawStockQty) : null,
    country: String(formData.get("country") || "") || null,
    lead_time: String(formData.get("lead_time") || "") || null,
    updated_at: new Date().toISOString(),
  };
  if (id) await admin.from("products").update(payload).eq("id", id);
  else await admin.from("products").insert(payload);
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
  const productId = String(formData.get("product_id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "");
  const unitPrice = Number(formData.get("unit_price") || 0);
  const rawCasePrice = formData.get("case_price");
  const rawCaseQty = formData.get("case_qty");
  const rawClosesAt = formData.get("closes_at");

  if (!productId || !title) return;

  const { error } = await admin.from("preorder_campaigns").insert({
    product_id: productId,
    title,
    description,
    unit_price: unitPrice,
    case_price: rawCasePrice ? Number(rawCasePrice) : null,
    case_qty: rawCaseQty ? Number(rawCaseQty) : null,
    status: "open",
    closes_at: rawClosesAt ? new Date(String(rawClosesAt)).toISOString() : null,
  });
  if (error) return;

  revalidatePath("/admin/preorders");
  redirect("/admin/preorders");
}

export async function updatePreorderCampaignAction(formData: FormData) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const campaignId = String(formData.get("campaign_id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "");
  const unitPrice = Number(formData.get("unit_price") || 0);
  const rawCasePrice = formData.get("case_price");
  const rawClosesAt = formData.get("closes_at");
  if (!campaignId || !title) return;
  await admin.from("preorder_campaigns").update({
    title,
    description,
    unit_price: unitPrice,
    case_price: rawCasePrice ? Number(rawCasePrice) : null,
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
  const supabase = await createSupabaseServerClient();
  const campaignId = String(formData.get("campaign_id") || "");
  const quantity = Math.max(1, Number(formData.get("quantity") || 1));
  const notes = String(formData.get("notes") || "") || null;

  const { data: campaign } = await supabase
    .from("preorder_campaigns")
    .select("id, status")
    .eq("id", campaignId)
    .single();

  if (!campaign || campaign.status !== "open") return;

  await supabase.from("preorder_commitments").upsert({
    campaign_id: campaignId,
    customer_id: profile.id,
    quantity,
    notes,
    updated_at: new Date().toISOString(),
  }, { onConflict: "campaign_id,customer_id" });

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

export async function deleteQuoteAction(quoteId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("quotes").delete().eq("id", quoteId);
  revalidatePath("/admin/quotes");
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
