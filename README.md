# Sleekandchic shop

The storefront at sleekandchic.com and the API the admin console uses
(`/api/v1/admin/*`). Next.js 16, Postgres (Supabase) through Drizzle,
better-auth for accounts, Paystack for card payments, Gmail (SMTP) or Resend
for email.

The admin console is a separate app: `../sleekandchic_admin`.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill it in (see below)
npm run db:migrate           # create the tables
npm run db:storage           # create the image buckets (needs Supabase keys)
npm run db:seed              # optional: sample products
npm run dev                  # http://localhost:3000
```

To use the admin console, sign up on the shop, then make that account an owner:

```bash
npm run db:make-owner -- you@example.com
```

## Settings (`.env.local`)

Every setting is described in `.env.example`; `lib/env.ts` checks them at start-up.

| Setting | Needed for |
| --- | --- |
| `DATABASE_URL` | Everything. Supabase transaction pooler (port 6543). |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Accounts. The URL is the shop's public address; it's also used in emails, payment returns and the sitemap. |
| `ADMIN_APP_URL` | The admin console's address (comma-separated if more than one). Needed for staff invitations and to let the console call the API. |
| `PAYSTACK_SECRET_KEY` | Payments. Every order is paid online, so without it checkout can't take orders. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Emails (order confirmations, new-order alerts to the shop, contact-form messages, password resets, staff invites) through any mail server. For the shop's Gmail: `smtp.gmail.com`, port `465`, the Gmail address, and an [app password](https://myaccount.google.com/apppasswords) (needs 2-step verification). No domain needed. |
| `RESEND_API_KEY`, `EMAIL_FROM` | The other way to send email: Resend, with `EMAIL_FROM` on a domain verified there. SMTP is used when both are set. Without either, emails are written to the log instead. |
| `OWNER_NOTIFICATION_EMAIL` | Where new-order alerts go when none are set in the admin's Settings page (defaults to the shop's contact email in `lib/store.ts`). |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Image uploads from the admin console. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional. Request limits use Postgres without them. |

Shop details (name, phone, WhatsApp, address, returns window) are in `lib/store.ts`.

## Email alerts for the shop

Once email is set up (above), the owner chooses in the admin's **Settings**
who gets an email for each new paid order (up to 5 addresses), whether it
lists sizes running low, and whether contact-form messages are emailed too.
**Send a test email** there checks the setup. Contact-form messages are also
kept in the admin's **Messages** inbox, so none are lost if email fails.

## Paystack

In the Paystack dashboard, set the webhook URL to
`https://<your shop>/api/v1/store/webhooks/payment`. Payments are confirmed by
that webhook and by the page shoppers return to, whichever comes first.
Unpaid card orders hold their stock for an hour, then are cancelled.

## Database changes

Schema lives in `lib/db/schema.ts`; every change needs a migration:

```bash
npm run db:generate   # writes drizzle/NNNN_*.sql from the schema change
npm run db:migrate    # applies it (run on every deploy)
```

A test fails if the schema changes without a migration.

**First deploy of this version on an existing database** (one that was set up
with `db:push` before migrations existed):

```bash
npm run db:push       # bring the live schema up to this code
npm run db:baseline   # record the existing migrations as applied
npm run db:migrate    # from now on, on every deploy
npm run db:storage    # refresh bucket settings (JPEG, PNG and WebP only)
```

## Checks

```bash
npm run lint
npx tsc --noEmit
npm test        # Vitest with an in-memory Postgres (PGlite); no setup needed
npm run build
```

GitHub Actions runs all four on every push (`.github/workflows/ci.yml`).

## Where things are

- `app/` pages and API routes (`app/api/v1/store/*` for the shop, `app/api/v1/admin/*` for the console)
- `lib/services/` the business rules: cart, checkout and orders, order statuses, payments, discounts, catalogue, customers, analytics, sales staff record (`staff-orders.ts`), inventory, reports, settings
- `lib/db/` schema, migrations scripts, seed
- `lib/email/` email templates and sending
- `tests/` API and rule tests
