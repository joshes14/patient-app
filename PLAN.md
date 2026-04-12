# 🦷 Dental Clinic Patient Records System
### Stack: Next.js + SQLite + Tauri (Rust) — No Hosting Required

---

## 📦 Tech Stack Overview

| Layer | Technology | Purpose |
|---|---|---|
| UI Framework | Next.js 14 (App Router) | Frontend + routing |
| Styling | Tailwind CSS + shadcn/ui | Components & design |
| Local Database | SQLite via `better-sqlite3` | Stores all patient data |
| Desktop Wrapper | Tauri 2 (Rust) | Packages app for Windows/Mac |
| Language | TypeScript | Type safety |

> **Why SQLite?** No server needed. The entire database is a single `.db` file stored locally on the clinic's computer. Perfect for offline, single-clinic use.

---

## 🛠️ Prerequisites

Install these before starting:

```bash
# 1. Node.js (v20+)
https://nodejs.org

# 2. Rust
https://rustup.rs

# 3. Tauri Prerequisites (Windows)
# Install Microsoft Visual Studio C++ Build Tools
# Install WebView2 (usually pre-installed on Windows 10/11)
# Full guide: https://tauri.app/start/prerequisites/
```

---

## 🚀 Project Setup

### Step 1 — Create the Next.js App

```bash
npx create-next-app@latest dental-clinic --typescript --tailwind --app --eslint
cd dental-clinic
```

### Step 2 — Install Dependencies

```bash
# UI Components
npx shadcn@latest init
npx shadcn@latest add button input label card table dialog form badge

# Database (SQLite)
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3

# Form handling & validation
npm install react-hook-form zod @hookform/resolvers

# Unique ID generation
npm install uuid
npm install --save-dev @types/uuid
```

### Step 3 — Add Tauri to the Project

```bash
npm install --save-dev @tauri-apps/cli
npx tauri init
```

When prompted:
- **App name:** `Dental Clinic`
- **Window title:** `Dental Clinic Records`
- **Web assets location:** `out`
- **Dev server URL:** `http://localhost:3000`
- **Dev command:** `npm run dev`
- **Build command:** `npm run build`

### Step 4 — Configure Next.js for Tauri

Edit `next.config.ts`:

```ts
const nextConfig = {
  output: "export",   // Static export for Tauri
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### Step 5 — Update `package.json` Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

---

## 🗄️ Database Setup

### Create `lib/db.ts`

```ts
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "clinic.db");
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    date_of_birth TEXT,
    sex TEXT,
    address TEXT,
    contact_number TEXT,
    email TEXT,
    emergency_contact_name TEXT,
    emergency_contact_number TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS medical_history (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    physician_name TEXT,
    physician_contact TEXT,
    is_under_medical_treatment INTEGER DEFAULT 0,
    medical_condition TEXT,
    is_taking_medication INTEGER DEFAULT 0,
    medications TEXT,
    has_allergy INTEGER DEFAULT 0,
    allergy_details TEXT,
    is_pregnant INTEGER DEFAULT 0,
    has_diabetes INTEGER DEFAULT 0,
    has_heart_disease INTEGER DEFAULT 0,
    has_hypertension INTEGER DEFAULT 0,
    has_bleeding_disorder INTEGER DEFAULT 0,
    notes TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS dental_history (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    previous_dentist TEXT,
    last_dental_visit TEXT,
    chief_complaint TEXT,
    has_bad_experience INTEGER DEFAULT 0,
    experience_details TEXT,
    is_anxious INTEGER DEFAULT 0,
    notes TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS intraoral_examination (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    examined_at TEXT DEFAULT (datetime('now')),
    soft_tissues TEXT,
    periodontium TEXT,
    occlusion TEXT,
    oral_hygiene_status TEXT,
    tooth_chart TEXT,
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS treatment_plans (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    tooth_number TEXT,
    procedure TEXT NOT NULL,
    estimated_cost REAL,
    priority TEXT DEFAULT 'routine',
    status TEXT DEFAULT 'planned',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS treatment_records (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    treatment_date TEXT NOT NULL,
    tooth_number TEXT,
    procedure TEXT NOT NULL,
    amount_charged REAL,
    amount_paid REAL,
    next_appointment TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );
`);

export default db;
```

---

## 📁 Recommended Folder Structure

```
dental-clinic/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Dashboard / patient list
│   ├── patients/
│   │   ├── new/page.tsx            # Add new patient
│   │   └── [id]/
│   │       ├── page.tsx            # Patient overview
│   │       ├── medical/page.tsx    # Medical history
│   │       ├── dental/page.tsx     # Dental history
│   │       ├── intraoral/page.tsx  # Intraoral exam
│   │       ├── plan/page.tsx       # Treatment plan
│   │       └── records/page.tsx    # Treatment records
│   └── api/
│       ├── patients/
│       │   └── route.ts
│       └── patients/[id]/
│           ├── route.ts
│           ├── medical/route.ts
│           ├── dental/route.ts
│           ├── intraoral/route.ts
│           ├── plan/route.ts
│           └── records/route.ts
├── lib/
│   └── db.ts                       # SQLite connection & schema
├── components/
│   ├── ui/                         # shadcn components (auto-generated)
│   ├── patient-card.tsx
│   ├── patient-form.tsx
│   └── sidebar.tsx
├── src-tauri/                      # Tauri/Rust (auto-generated)
│   ├── src/
│   │   └── main.rs
│   └── tauri.conf.json
├── clinic.db                       # SQLite database file (auto-created)
└── next.config.ts
```

---

## 🔐 Clinician Login (Simple Auth)

Since only one clinician uses this, use a simple local PIN/password stored in a config file or environment variable. No need for JWT or OAuth.

Create `.env.local`:

```env
CLINIC_PASSWORD=your_secure_password_here
```

Create `lib/auth.ts`:

```ts
import { cookies } from "next/headers";

export function isAuthenticated(): boolean {
  const cookieStore = cookies();
  return cookieStore.get("clinic_auth")?.value === "true";
}

export function checkPassword(input: string): boolean {
  return input === process.env.CLINIC_PASSWORD;
}
```

---

## 🪪 Patient ID Format

Each patient gets a unique ID generated on creation:

```ts
import { v4 as uuidv4 } from "uuid";

// Short readable ID: e.g., PT-2024-A3F9
const generatePatientId = () => {
  const short = uuidv4().split("-")[0].toUpperCase();
  const year = new Date().getFullYear();
  return `PT-${year}-${short}`;
};
```

---

## 🖥️ Running the App

```bash
# Development (browser)
npm run dev

# Development (desktop window via Tauri)
npm run tauri:dev

# Build final .exe / .dmg installer
npm run tauri:build
```

The final build produces a **standalone installer** — just double-click to install on the clinic's computer. No internet or server required.

---

## 📋 Feature Checklist

- [ ] Clinician login (password protected)
- [ ] Patient list with search & filter
- [ ] Add / Edit patient personal information
- [ ] Unique Patient ID per record
- [ ] Medical history form
- [ ] Dental history form
- [ ] Intraoral examination form (+ optional tooth chart)
- [ ] Treatment plan (per tooth, procedure, cost, status)
- [ ] Treatment records (date, procedure, payment)
- [ ] Patient detail view (all info in one place)
- [ ] Export patient record to PDF *(optional, future)*

---

## 💡 Tips

- **Backup:** The entire database is `clinic.db`. Just copy that file to a USB drive to back up all patient records.
- **Tauri + Next.js API routes:** API routes still work in dev mode. For the production build (`output: "export"`), move your DB logic into Tauri's Rust commands via `invoke()` if you need DB access in the built app. For simplicity during development, keep logic in API routes first.
- **shadcn/ui** comes with a `Form` component built on `react-hook-form` + `zod` — use this for all your patient forms for built-in validation.

---

## 🔗 Useful Docs

- [Next.js App Router](https://nextjs.org/docs/app)
- [Tauri 2 Getting Started](https://tauri.app/start/)
- [shadcn/ui Components](https://ui.shadcn.com)
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [Tauri + Next.js Guide](https://tauri.app/guides/frameworks/nextjs/)
