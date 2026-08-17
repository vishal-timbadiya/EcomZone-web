# Deployment Guide — ecomzone.in on Hostinger

EcomZone is a **Node.js application**, not static files or PHP. Next.js runs in
server mode with a custom Express server, so it needs a persistent Node process.

> **This will not run on Hostinger shared/Premium/Business web hosting.**
> Those plans serve PHP and static files only — there is no way to keep a Node
> process alive. You need **Hostinger VPS** (any KVM plan). If you are currently
> on a shared plan, upgrade before continuing.

Target: `https://ecomzone.in`

---

## 1. Prerequisites

- Hostinger VPS (Ubuntu 22.04 or 24.04), root SSH access
- The domain `ecomzone.in` with DNS managed at Hostinger
- A PostgreSQL database (either on the same VPS, or Hostinger/Neon/Supabase managed)
- Razorpay live API keys

---

## 2. Point the domain at the VPS

In **hPanel → Domains → DNS Zone** for `ecomzone.in`, set:

| Type | Name  | Value              | TTL  |
| ---- | ----- | ------------------ | ---- |
| A    | `@`   | *your VPS IPv4*    | 3600 |
| A    | `www` | *your VPS IPv4*    | 3600 |

Remove conflicting A/CNAME records for `@` and `www`. DNS takes up to an hour.

---

## 3. Prepare the server

SSH in as root, then:

```bash
apt update && apt upgrade -y

# Node.js 20 LTS (Next 16 requires >= 20; the old vercel.json pinned 18, which is too old)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git nginx postgresql postgresql-contrib
npm install -g pm2

node -v   # expect v20.x
```

Create a non-root user to run the app:

```bash
adduser --disabled-password --gecos "" ecomzone
usermod -aG www-data ecomzone
```

---

## 4. Create the database

Skip if you are using a managed database — just keep its connection string.

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE ecomzone;
CREATE USER ecomzone_user WITH ENCRYPTED PASSWORD 'use-a-long-random-password';
GRANT ALL PRIVILEGES ON DATABASE ecomzone TO ecomzone_user;
\c ecomzone
GRANT ALL ON SCHEMA public TO ecomzone_user;
\q
```

Connection string:

```
postgresql://ecomzone_user:use-a-long-random-password@localhost:5432/ecomzone?schema=public
```

---

## 5. Deploy the code

```bash
su - ecomzone
git clone <your-repo-url> ~/app
cd ~/app
git checkout New          # or main, once merged
npm ci
```

Create `.env` (see `.env.example` for the full list):

```bash
nano ~/app/.env
```

```ini
DATABASE_URL="postgresql://ecomzone_user:...@localhost:5432/ecomzone?schema=public"

# Must be >= 32 random chars or the server refuses to boot.
# Generate: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET="<paste generated value>"
JWT_EXPIRES_IN=7d

NODE_ENV=production
PORT=3000
TRUST_PROXY_HOPS=1

FRONTEND_URL=https://ecomzone.in
NEXT_PUBLIC_API_URL=https://ecomzone.in/api
NEXT_PUBLIC_BACKEND_URL=https://ecomzone.in
NEXT_PUBLIC_SITE_URL=https://ecomzone.in
NEXT_PUBLIC_APP_URL=https://ecomzone.in
NEXT_PUBLIC_APP_NAME=EcomZone

RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxx

EMAIL_USER=you@gmail.com
EMAIL_PASS=<gmail app password>

# Only needed if accounts created before the bcrypt migration still exist.
ENCRYPTION_KEY=<the old value, or blank>
```

Lock it down — it holds live payment keys:

```bash
chmod 600 ~/app/.env
```

Apply the schema, seed the admin, and build:

```bash
cd ~/app
npx prisma db push
SUPER_ADMIN_EMAIL=you@example.com SUPER_ADMIN_PASSWORD='a-long-strong-password' npm run db:seed-admin
npm run build
```

`db push` adds the new `razorpayOrderId` / `razorpayPaymentId` columns, the
`updatedAt` column, and the indexes. It preserves existing data.

---

## 6. Run it under PM2

```bash
cd ~/app
pm2 start npm --name ecomzone -- start
pm2 save
pm2 startup systemd -u ecomzone --hp /home/ecomzone
# run the command it prints, as root
```

Check it came up:

```bash
pm2 logs ecomzone --lines 40
curl -s localhost:3000/health
```

`/health` should report `"database":"connected"`. If the process exits at boot
with a message about `JWT_SECRET`, the secret is missing or too short — that
check is deliberate.

---

## 7. Nginx reverse proxy

```bash
exit   # back to root
nano /etc/nginx/sites-available/ecomzone
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name ecomzone.in www.ecomzone.in;

    # Bulk product/ZIP imports need a large body.
    client_max_body_size 120M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
```

`X-Forwarded-For` matters: rate limiting keys on the client IP, and the app
trusts exactly `TRUST_PROXY_HOPS` (1) proxies. Get this wrong and every visitor
shares one rate-limit bucket.

```bash
ln -s /etc/nginx/sites-available/ecomzone /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

---

## 8. HTTPS

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ecomzone.in -d www.ecomzone.in
```

Choose redirect HTTP → HTTPS. Certbot installs a renewal timer automatically;
confirm with `certbot renew --dry-run`.

---

## 9. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

Postgres stays on `localhost` and must **not** be exposed.

---

## 10. Razorpay webhook

At *dashboard.razorpay.com → Settings → Webhooks → Add New Webhook*:

- **URL**: `https://ecomzone.in/api/payment/razorpay/webhook`
- **Secret**: the same value as `RAZORPAY_WEBHOOK_SECRET`
- **Events**: `payment.captured`, `payment.failed`, `order.paid`

Verify with a live test order. The webhook must return 200; a signature mismatch
returns 400 and Razorpay will show the delivery as failed.

---

## 11. Post-deploy checks

```bash
curl -s https://ecomzone.in/health
curl -s -o /dev/null -w '%{http_code}\n' https://ecomzone.in/api/products          # 200
curl -s -o /dev/null -w '%{http_code}\n' https://ecomzone.in/api/admin/users       # 401
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://ecomzone.in/api/upload    # 401
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  -H 'Content-Type: application/json' -d '{}' \
  https://ecomzone.in/api/payment/razorpay/webhook                                 # 400
```

Then in a browser: sign in, place a COD order, place a Razorpay order, and
confirm both appear under `/admin/orders` with the right payment status.

---

## 12. Updating

```bash
su - ecomzone
cd ~/app
git pull
npm ci
npx prisma db push      # only when the schema changed
npm run build
pm2 restart ecomzone
```

---

## Uploads and backups

Product images are written to `~/app/public/uploads` on the VPS disk. They are
not in git, so back them up along with the database:

```bash
# database
pg_dump -U ecomzone_user ecomzone | gzip > ~/backup-$(date +%F).sql.gz

# uploaded images
tar czf ~/uploads-$(date +%F).tar.gz -C ~/app/public uploads
```

Add both to a cron job and copy them off the VPS.

---

## Troubleshooting

| Symptom | Cause |
| ------- | ----- |
| Process exits at boot mentioning `JWT_SECRET` | Secret missing, under 32 chars, or a placeholder. Generate a real one. |
| `502 Bad Gateway` | Node process is down — `pm2 logs ecomzone`. |
| `/health` says `database: disconnected` | Wrong `DATABASE_URL`, or Postgres is not running. |
| Everyone gets rate limited at once | `X-Forwarded-For` not set in nginx, or `TRUST_PROXY_HOPS` mismatched. |
| Razorpay webhook shows failures | `RAZORPAY_WEBHOOK_SECRET` does not match the dashboard value. |
| CORS errors in the browser | `FRONTEND_URL` does not match the origin actually being used. |
| Uploads 401 | Expected — uploading now requires an admin session. |
| Bulk import fails on a big ZIP | Raise `client_max_body_size` in nginx and `BULK_IMPORT_MAX_BYTES`. |
