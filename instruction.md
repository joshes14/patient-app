# Discord-Style Backend Guide (Cloudflare Workers, 2026)

This guide turns the app into a local desktop client plus one shared Cloudflare Workers backend.

## Best free stack

- Cloudflare Workers for the API
- Cloudflare D1 for the database
- `workers.dev` hostname for free HTTPS

## Why this path

- Free host name included
- No VM to pay for
- No public ports to manage
- Desktop app can keep using one backend URL

## Reality check

Your current backend code is SQLite-based Next.js server code.

To use Cloudflare Workers, the backend must be ported to Worker routes + D1 storage.

The desktop app already supports a remote backend URL, so the client side is mostly ready.

---

## Target architecture

1. Windows app runs locally
2. It forwards all `/api/*` traffic to a Cloudflare Worker URL
3. The Worker reads/writes shared clinic data in D1
4. Every PC uses the same backend URL

Example:

`https://patientapp-backend.<your-name>.workers.dev`

---

## Step 0 - Prerequisites

- Cloudflare account
- Node.js 22 LTS
- Git
- Wrangler CLI
- Your clinic app repo

Install Wrangler:

```bash
npm install -g wrangler
wrangler login
```

---

## Step 1 - Create the Worker project

The repo now includes a scaffold in `cloudflare-worker/`.

Go there and install:

```bash
cd cloudflare-worker
npm install
```

---

## Step 2 - Create D1

```bash
wrangler d1 create patientapp
```

Update `cloudflare-worker/wrangler.toml` with the real database ID.

Create migrations for the schema that matches the current app tables:

- `app_settings`
- `practitioners`
- `patients`
- `medical_history`
- `dental_history`
- `intraoral_examination`
- `treatment_plans`
- `treatment_records`

Apply them:

```bash
wrangler d1 migrations apply patientapp --remote
```

---

## Step 3 - Finish the Worker routes

The scaffold is created, but you still need to wire the real handlers for:

- login/logout
- settings
- practitioners
- patients
- medical history
- dental history
- intraoral exams
- treatment plans
- treatment records

Use the same JSON shapes as the current app.

---

## Step 4 - Set secrets

```bash
wrangler secret put CLINIC_SESSION_SECRET
wrangler secret put CLINIC_PASSWORD
wrangler secret put CLINIC_PRACTITIONER_ID
```

---

## Step 5 - Deploy Worker

```bash
cd cloudflare-worker
wrangler deploy
```

You will get a free URL like:

`https://patientapp-backend.<your-name>.workers.dev`

---

## Step 6 - Point desktop app at Worker

Set:

```env
CLINIC_BACKEND_URL=https://patientapp-backend.<your-name>.workers.dev
NEXT_PUBLIC_CLINIC_BACKEND_URL=https://patientapp-backend.<your-name>.workers.dev
CLINIC_SESSION_SECRET=REPLACE_WITH_THE_SAME_SECRET
```

---

## Step 7 - Migrate data

Export your current SQLite data and import it into D1.

If you keep your local DB as a source, use SQL export/import.

---

## Step 8 - Verify

1. Log in from Computer A
2. Create a patient
3. Open the app on Computer B
4. Confirm the same patient appears

---

## Deployment checklist

Backend:

1. Create D1 database
2. Add migrations
3. Wire Worker routes
4. Set secrets
5. Deploy Worker
6. Test login and CRUD

Desktop:

1. Set `CLINIC_BACKEND_URL`
2. Set `NEXT_PUBLIC_CLINIC_BACKEND_URL`
3. Set `CLINIC_SESSION_SECRET`
4. Build the installer

---

## Final outcome

The desktop app stays local, the backend is free Cloudflare infrastructure, and shared clinic data lives in D1 behind one Workers URL.
