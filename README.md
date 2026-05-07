# World Fan Gear B2B Ecommerce Platform

This repository now uses the production-oriented Next.js app in `web/`.

The old Vite/Express JSON-file MVP has been removed so there is only one active application path.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Stripe
- Nodemailer/SMTP email hooks
- React Hook Form + Zod

## Setup

Install the web app dependencies:

```bash
npm run install:web
```

Create the local environment file:

```bash
copy web\.env.example web\.env.local
```

Fill in:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
EMAIL_FROM
ADMIN_EMAIL
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
```

Apply Supabase SQL in this order:

```text
web/supabase/migrations/001_b2b_schema.sql
web/supabase/seed/seed.sql
```

Create demo users and sample B2B records:

```bash
npm run seed
```

## Run

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Important Routes

- `/`
- `/products`
- `/cart`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/account`
- `/account/orders`
- `/account/quotes`
- `/admin`
- `/admin/products`
- `/admin/customers`
- `/admin/orders`
- `/admin/quotes`

Admin routes require a profile with `role = 'admin'`.

## Stripe Webhook Test

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret into:

```text
STRIPE_WEBHOOK_SECRET
```

## Test Commands

```bash
npm run lint
npm run build
```

Manual B2B flow testing is documented in:

```text
web/TEST_CHECKLIST.md
```
