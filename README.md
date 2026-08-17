# EcomZone

Wholesale storefront and admin panel. Next.js 16 (App Router) and an Express API
served from a single Node process, backed by PostgreSQL via Prisma 7.

## Architecture

One process serves everything. `server/custom-server.ts` creates the HTTP server
and routes each request:

| Path                            | Handled by                        |
| ------------------------------- | --------------------------------- |
| `/api/auth/*`                   | Next.js route handlers (`app/api`) |
| `/api/*` (everything else)      | Express (`server/api`)             |
| `/uploads/*`, `/health`         | Express                            |
| everything else                 | Next.js pages                      |

Because `/api/auth/*` never reaches Express, those endpoints rate limit
themselves through `lib/rateLimit.ts` rather than the Express middleware in
`server/lib/rateLimiter.ts`.

```
app/            Next.js pages, components, and the /api/auth route handlers
server/api/     Express routers (products, orders, cart, payment, admin, ...)
server/lib/     Server-only modules (prisma, auth, razorpay, mailer, shipping)
lib/            Shared modules usable from both sides (jwt, password, schemas)
prisma/         Schema and seed scripts
```

## Getting started

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL and JWT_SECRET
npx prisma db push        # apply the schema
npm run db:seed-admin     # create the super admin (reads SUPER_ADMIN_* vars)
npm run dev
```

Open http://localhost:3000.

`JWT_SECRET` must be at least 32 random characters — the server refuses to start
otherwise. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Scripts

| Command                | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Start the unified dev server                     |
| `npm run build`        | Generate the Prisma client and build Next.js     |
| `npm start`            | Start the production server                      |
| `npm run typecheck`    | Type check both the app and the Express backend  |
| `npm run lint`         | ESLint                                           |
| `npm run db:push`      | Apply the Prisma schema to the database          |
| `npm run db:seed`      | Seed sample products (**deletes existing ones**) |
| `npm run db:seed-admin`| Create or update the super admin account         |

`npm run typecheck` covers `server/` as well as `app/`. Run it in CI — the
backend was previously excluded from every type check, which is how a batch of
unresolvable imports reached the main branch.

## Payments

Online payment goes through **Razorpay**. Cash on delivery needs no gateway.

The flow:

1. `POST /api/orders/create` writes the order with `paymentStatus: PENDING`.
   Prices, weight and shipping are all recalculated server-side from the
   database — nothing about the amount is taken from the request body.
2. `POST /api/payment/razorpay/create` creates the gateway order for the amount
   stored on the order, and returns the public key plus the gateway order id.
3. The browser opens Razorpay Checkout.
4. `POST /api/payment/razorpay/verify` checks the HMAC signature on the callback
   and marks the order paid. This is the fast path for the success page.
5. `POST /api/payment/razorpay/webhook` is the authoritative source of truth.
   It verifies the signature over the **raw** request body, confirms the captured
   amount matches the order total, and is idempotent.

Both verification paths reject anything they cannot authenticate, so a payment
cannot be confirmed by a caller that does not hold the API secret.

Configure the webhook at *dashboard.razorpay.com → Settings → Webhooks*:

- URL: `https://ecomzone.in/api/payment/razorpay/webhook`
- Events: `payment.captured`, `payment.failed`, `order.paid`
- Set the same secret in `RAZORPAY_WEBHOOK_SECRET`

## Passwords

Passwords are stored as bcrypt hashes. Accounts created before that change hold
reversible AES ciphertext; those still authenticate through a legacy read path
and are transparently re-hashed on the next successful login. `ENCRYPTION_KEY`
is only needed while such accounts remain and can be dropped afterwards.

There is no way to read a user's password back — the admin panel exposes a
password reset instead.

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).
