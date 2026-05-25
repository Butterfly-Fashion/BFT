"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateTotals } from "@/lib/money";
import { sendEmail } from "@/lib/email";
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

  const extFromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  const extFromType = file.type.split("/")[1]?.replace("jpeg", "jpg");
  const ext = extFromName || extFromType || "jpg";
  const safeName = `${slug}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "asset", "images", "admin-products");
  await mkdir(uploadDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, safeName), bytes);
  return `/asset/images/admin-products/${safeName}`;
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
    html: "<p>Your account has been created. B2B pricing will be available after admin approval.</p>",
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
    .select("product_id, price")
    .eq("customer_id", profile.id)
    .in("product_id", productIds);

  const priceMap = new Map((customerPrices || []).map((row) => [row.product_id, Number(row.price)]));
  const productMap = new Map(products.map((product) => [product.id, product]));
  if (input.items.some((item) => !productMap.has(item.productId))) {
    return { error: "A product in your cart is no longer available. Please remove it and try again." };
  }
  const itemSnapshots = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error("Missing product after validation.");
    const quantity = Math.max(1, Number(item.quantity));
    const unitPrice = profile.is_b2b_approved ? priceMap.get(product.id) ?? Number(product.base_price) : Number(product.base_price);
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
    subject: "Order request received",
    html: `<p>Your order request has been submitted. We will confirm availability, pricing, and delivery details before payment.</p><p>Order ID: ${order.id}</p>`,
  });
  await sendEmail({
    to: process.env.ADMIN_EMAIL || profile.email,
    subject: "New order request",
    html: `<p>New order request from ${profile.business_name}.</p><p>Order ID: ${order.id}</p>`,
  });

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
      subject: "Your order is ready — Pay Now",
      html: `<p>Your order has been reviewed and is ready for payment. Click the link below to complete your purchase.</p><p><a href="${paymentLink}">Pay Now</a></p>`,
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
    subject: "Your payment link is ready",
    html: `<p>Your order has been approved. Please complete payment here:</p><p><a href="${paymentLink}">${paymentLink}</a></p>`,
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
        subject: "Your B2B account has been approved",
        html: `<p>Hi ${profile.contact_name || profile.business_name},</p>
<p>Your B2B account has been approved. You can now log in and place wholesale orders at your B2B pricing.</p>
<p><a href="${siteUrl()}/login">Log in to your account →</a></p>
<p>If you have any questions, reply to this email or contact us directly.</p>`,
      });
    } else {
      await sendEmail({
        to: profile.email,
        subject: "Your B2B account status has changed",
        html: `<p>Hi ${profile.contact_name || profile.business_name},</p>
<p>Your B2B account access has been updated. Please contact us if you have any questions.</p>`,
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
  await sendEmail({
    to: process.env.ADMIN_EMAIL || profile.email,
    subject: "New quote request",
    html: `<p>${profile.business_name} requested a quote.</p><p>${message}</p>`,
  });
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

  const payload = {
    name,
    slug,
    description: String(formData.get("description") || ""),
    sku,
    barcode: String(formData.get("barcode") || "") || null,
    base_price: Number(formData.get("base_price") || 0),
    image_url: uploadedImageUrl || String(formData.get("image_url") || "") || null,
    category,
    availability_status: String(formData.get("availability_status") || "Manual Confirm"),
    is_bulk_available: formData.get("is_bulk_available") === "on",
    is_hidden: formData.get("is_hidden") === "on",
    weight_kg: rawWeightKg ? Number(rawWeightKg) : null,
    box_length_cm: rawBoxL ? Number(rawBoxL) : null,
    box_width_cm: rawBoxW ? Number(rawBoxW) : null,
    box_height_cm: rawBoxH ? Number(rawBoxH) : null,
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
  const price = Number(formData.get("price"));
  await admin.from("customer_prices").upsert({
    customer_id: customerId,
    product_id: productId,
    price,
    min_quantity: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "customer_id,product_id,min_quantity" });
  revalidatePath("/admin/customers");
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
