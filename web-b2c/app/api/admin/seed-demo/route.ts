import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";

// Only available in development
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  const demoOrders = [
    {
      order_number: "WFG-2026-0001",
      stripe_session_id: "cs_test_demo_0001",
      stripe_payment_intent: "pi_test_demo_0001",
      delivery_method: "shipping",
      status: "paid",
      customer_email: "john.smith@gmail.com",
      customer_name: "John Smith",
      shipping_address: { street: "123 Bay St", city: "Toronto", province: "ON", postal: "M5H 2R2", country: "Canada" },
      subtotal: 49.97,
      shipping_cost: 12.00,
      tax_amount: 8.05,
      total: 70.02,
      carrier: null,
      tracking_number: null,
      tracking_url: null,
      admin_note: null,
      items: [
        { name: "Canada Flag Car Flag", quantity: 2, unit_price: 14.99 },
        { name: "Canada Bucket Hat", quantity: 1, unit_price: 19.99 },
      ],
    },
    {
      order_number: "WFG-2026-0002",
      stripe_session_id: "cs_test_demo_0002",
      stripe_payment_intent: "pi_test_demo_0002",
      delivery_method: "pickup",
      status: "packing",
      customer_email: "sarah.johnson@outlook.com",
      customer_name: "Sarah Johnson",
      shipping_address: null,
      subtotal: 44.98,
      shipping_cost: 0,
      tax_amount: 5.85,
      total: 50.83,
      carrier: null,
      tracking_number: null,
      tracking_url: null,
      admin_note: "고객이 토요일 픽업 원함",
      items: [
        { name: "Canada Souvenir Mini Boxing Glove", quantity: 1, unit_price: 24.99 },
        { name: "World Cup 2026 Snapback Cap", quantity: 1, unit_price: 19.99 },
      ],
    },
    {
      order_number: "WFG-2026-0003",
      stripe_session_id: "cs_test_demo_0003",
      stripe_payment_intent: "pi_test_demo_0003",
      delivery_method: "shipping",
      status: "shipped",
      customer_email: "michael.chen@yahoo.ca",
      customer_name: "Michael Chen",
      shipping_address: { street: "456 Granville St Apt 8", city: "Vancouver", province: "BC", postal: "V6C 1T2", country: "Canada" },
      subtotal: 69.97,
      shipping_cost: 18.00,
      tax_amount: 11.40,
      total: 99.37,
      carrier: "Canada Post",
      tracking_number: "1234 5678 9012 3456",
      tracking_url: "https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=123456789012",
      admin_note: null,
      items: [
        { name: "Argentina Flag Car Flag", quantity: 1, unit_price: 14.99 },
        { name: "Brazil Bucket Hat", quantity: 2, unit_price: 19.99 },
        { name: "World Cup 2026 Snapback Cap", quantity: 2, unit_price: 17.00 },
      ],
    },
    {
      order_number: "WFG-2026-0004",
      stripe_session_id: "cs_test_demo_0004",
      stripe_payment_intent: "pi_test_demo_0004",
      delivery_method: "shipping",
      status: "completed",
      customer_email: "emily.davis@hotmail.com",
      customer_name: "Emily Davis",
      shipping_address: { street: "789 Rue Sainte-Catherine", city: "Montreal", province: "QC", postal: "H3B 1B6", country: "Canada" },
      subtotal: 54.97,
      shipping_cost: 15.00,
      tax_amount: 9.11,
      total: 79.08,
      carrier: "FedEx",
      tracking_number: "7489 2345 6789",
      tracking_url: null,
      admin_note: null,
      items: [
        { name: "Brazil Flag Souvenir Mini Boxing Glove", quantity: 1, unit_price: 24.99 },
        { name: "Canada Car Flag", quantity: 2, unit_price: 14.99 },
      ],
    },
    {
      order_number: "WFG-2026-0005",
      stripe_session_id: "cs_test_demo_0005",
      stripe_payment_intent: "pi_test_demo_0005",
      delivery_method: "pickup",
      status: "ready_for_pickup",
      customer_email: "james.wilson@gmail.com",
      customer_name: "James Wilson",
      shipping_address: null,
      subtotal: 49.98,
      shipping_cost: 0,
      tax_amount: 6.50,
      total: 56.48,
      carrier: null,
      tracking_number: null,
      tracking_url: null,
      admin_note: null,
      items: [
        { name: "Mexico Flag Souvenir Mini Boxing Glove", quantity: 2, unit_price: 24.99 },
      ],
    },
    {
      order_number: "WFG-2026-0006",
      stripe_session_id: "cs_test_demo_0006",
      stripe_payment_intent: "pi_test_demo_0006",
      delivery_method: "shipping",
      status: "packing",
      customer_email: "lisa.park@gmail.com",
      customer_name: "Lisa Park",
      shipping_address: { street: "321 17th Ave SW", city: "Calgary", province: "AB", postal: "T2S 0B3", country: "Canada" },
      subtotal: 74.96,
      shipping_cost: 16.00,
      tax_amount: 12.09,
      total: 103.05,
      carrier: null,
      tracking_number: null,
      tracking_url: null,
      admin_note: null,
      items: [
        { name: "Canada Flag Car Flag", quantity: 3, unit_price: 14.99 },
        { name: "World Cup 2026 Bucket Hat", quantity: 1, unit_price: 19.99 },
        { name: "World Cup 2026 Snapback Cap", quantity: 1, unit_price: 19.99 },
      ],
    },
    {
      order_number: "WFG-2026-0007",
      stripe_session_id: "cs_test_demo_0007",
      stripe_payment_intent: "pi_test_demo_0007",
      delivery_method: "shipping",
      status: "shipped",
      customer_email: "robert.brown@rogers.com",
      customer_name: "Robert Brown",
      shipping_address: { street: "55 Sparks St Unit 12", city: "Ottawa", province: "ON", postal: "K1P 5A9", country: "Canada" },
      subtotal: 34.98,
      shipping_cost: 12.00,
      tax_amount: 6.11,
      total: 53.09,
      carrier: "UPS",
      tracking_number: "1Z999AA10123456784",
      tracking_url: null,
      admin_note: "전화로 주문 확인 완료",
      items: [
        { name: "Argentina Flag Car Flag", quantity: 1, unit_price: 14.99 },
        { name: "Brazil Flag Car Flag", quantity: 1, unit_price: 19.99 },
      ],
    },
    {
      order_number: "WFG-2026-0008",
      stripe_session_id: "cs_test_demo_0008",
      stripe_payment_intent: "pi_test_demo_0008",
      delivery_method: "pickup",
      status: "paid",
      customer_email: "jennifer.lee@icloud.com",
      customer_name: "Jennifer Lee",
      shipping_address: null,
      subtotal: 59.97,
      shipping_cost: 0,
      tax_amount: 7.80,
      total: 67.77,
      carrier: null,
      tracking_number: null,
      tracking_url: null,
      admin_note: null,
      items: [
        { name: "World Cup 2026 Snapback Cap", quantity: 2, unit_price: 19.99 },
        { name: "Canada Flag Car Flag", quantity: 1, unit_price: 14.99 },
        { name: "Canada Souvenir Mini Boxing Glove", quantity: 1, unit_price: 4.99 },
      ],
    },
    {
      order_number: "WFG-2026-0009",
      stripe_session_id: "cs_test_demo_0009",
      stripe_payment_intent: "pi_test_demo_0009",
      delivery_method: "shipping",
      status: "cancelled",
      customer_email: "david.kim@gmail.com",
      customer_name: "David Kim",
      shipping_address: { street: "100 King St W", city: "Toronto", province: "ON", postal: "M5X 1A9", country: "Canada" },
      subtotal: 44.98,
      shipping_cost: 12.00,
      tax_amount: 7.43,
      total: 64.41,
      carrier: null,
      tracking_number: null,
      tracking_url: null,
      admin_note: "고객 요청으로 취소",
      items: [
        { name: "Mexico Bucket Hat", quantity: 1, unit_price: 19.99 },
        { name: "USA Flag Car Flag", quantity: 1, unit_price: 14.99 },
        { name: "World Cup Sticker Pack", quantity: 2, unit_price: 4.99 },
      ],
    },
    {
      order_number: "WFG-2026-0010",
      stripe_session_id: "cs_test_demo_0010",
      stripe_payment_intent: "pi_test_demo_0010",
      delivery_method: "shipping",
      status: "paid",
      customer_email: "amanda.white@bell.ca",
      customer_name: "Amanda White",
      shipping_address: { street: "88 Queens Quay W Apt 2201", city: "Toronto", province: "ON", postal: "M5J 0B8", country: "Canada" },
      subtotal: 99.95,
      shipping_cost: 0,
      tax_amount: 12.99,
      total: 112.94,
      carrier: null,
      tracking_number: null,
      tracking_url: null,
      admin_note: null,
      items: [
        { name: "Canada Flag Souvenir Mini Boxing Glove", quantity: 2, unit_price: 24.99 },
        { name: "Brazil Flag Car Flag", quantity: 2, unit_price: 14.99 },
        { name: "World Cup 2026 Bucket Hat", quantity: 1, unit_price: 19.99 },
      ],
    },
  ];

  let inserted = 0;

  for (const demo of demoOrders) {
    const { items, ...orderData } = demo;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .upsert(orderData, { onConflict: "stripe_session_id" })
      .select("id")
      .single();

    if (orderErr) {
      console.error("[seed] order error:", orderErr.message);
      continue;
    }

    await supabase.from("order_items").delete().eq("order_id", order.id);
    await supabase.from("order_items").insert(
      items.map((item) => ({ ...item, order_id: order.id }))
    );

    inserted++;
  }

  return NextResponse.json({ inserted, total: demoOrders.length });
}
