# B2B Next.js Test Checklist

## Automated Commands

```bash
npm run lint --prefix web
npm run build --prefix web
npm test
```

## Supabase Setup

1. Create a Supabase project.
2. Copy `web/.env.example` to `web/.env.local`.
3. Fill Supabase URL, anon key, and service role key.
4. Run SQL:
   - `web/supabase/migrations/001_b2b_schema.sql`
   - `web/supabase/seed/seed.sql`
5. Run:

```bash
npm run seed --prefix web
```

## Manual Functional Tests

1. Guest can view `/` and `/products`.
2. Guest clicking Add to Cart is sent to `/login`.
3. Customer can register at `/register`.
4. Customer can log in at `/login`.
5. Customer can add products to cart.
6. Customer can submit order request from `/cart`.
7. Order is stored as `Pending Review` and `Unpaid`.
8. Customer can view own orders at `/account/orders`.
9. Admin can log in with seeded admin.
10. Admin can access `/admin`; non-admin cannot.
11. Admin can view pending orders at `/admin/orders`.
12. Admin can open `/admin/orders/[id]`.
13. Admin can edit quantity, unit price, shipping, discount, HST, and notes.
14. Admin can approve order.
15. Admin can create payment link.
16. Payment link is saved and status becomes `Payment Link Sent`.
17. Stripe webhook marks order `Paid`.
18. Invoice record is created.
19. Approved B2B customer sees customer-specific price.
20. Product base price is not changed by order item edits.

## Stripe Webhook Test

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Set the printed webhook secret in:

```text
STRIPE_WEBHOOK_SECRET
```

Use test card:

```text
4242 4242 4242 4242
```

