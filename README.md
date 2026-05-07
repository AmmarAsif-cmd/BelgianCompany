# 🧇 Belgian Waffle Co. — Stock Tracker

A mobile-first weekly stock counting app for The Belgian Waffle Company's two stores (Stockport Road and Sale). Staff open the app on their phone, log in with a 4-digit PIN, and enter how many of each item they currently have. The app saves the counts and shows a live order list of anything that's running low, grouped by supplier.

---

## What's inside

| Path | What it does |
|------|-------------|
| `supabase/schema.sql` | All database tables + Row Level Security policies |
| `supabase/seed.sql` | Stores, suppliers, and every stock item |
| `src/app/` | All pages (Next.js App Router) |
| `src/components/` | Reusable UI components |
| `src/lib/supabase/` | Supabase client helpers |
| `src/lib/db/` | Database query functions |
| `src/lib/utils/` | Week helper and classnames utility |

---

## Prerequisites

- **Node 20 or newer** — check with `node --version`
- **A Supabase account** — free at [supabase.com](https://supabase.com)
- **A Vercel account** — free at [vercel.com](https://vercel.com)

---

## Local setup (step by step)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd belgian-waffle-stock-tracker
npm install
```

### 2. Create your Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Give it a name, choose a region close to the UK (e.g. West EU), pick a strong password
3. Wait about 2 minutes for it to spin up

### 3. Set up the database

In your Supabase project:

1. Go to **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql` and paste it in — click **Run**
4. Create another new query
5. Copy the entire contents of `supabase/seed.sql` and paste it in — click **Run**

### 4. Enable anonymous sign-ins

In your Supabase project:

1. Go to **Authentication** → **Providers**
2. Scroll down to **Anonymous Sign-ins**
3. Toggle it **on** and save

### 5. Get your API keys

In your Supabase project:

1. Go to **Project Settings** (gear icon) → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxxxxxxxx.supabase.co`)
   - **anon public** key (a long JWT string)

### 6. Set up environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 7. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser (or on your phone if you're on the same Wi-Fi).

**Default PINs:**
- Stockport Road: `1234`
- Sale: `5678`

Change these in Supabase — see "Changing PINs" below.

---

## Deploy to Vercel

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. In the **Environment Variables** section, add both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your real values
4. Click **Deploy** — Vercel auto-detects Next.js

Your app will be live at `https://your-project.vercel.app`.

---

## How to change PINs

Go to your Supabase project → **SQL Editor** → run:

```sql
UPDATE stores SET pin = '9999' WHERE slug = 'stockport-road';
UPDATE stores SET pin = '0000' WHERE slug = 'sale';
```

Replace `9999` and `0000` with whatever 4-digit PINs you want.

---

## How to add new items

```sql
INSERT INTO items (name, category, supplier_id, min_stock)
SELECT 'New Item Name', 'Food', id, 2
FROM suppliers
WHERE name = 'Zahid Bhai';
```

Replace `'New Item Name'`, `'Food'`, `'Zahid Bhai'`, and the min_stock number as needed.

---

## How to add a new supplier

```sql
INSERT INTO suppliers (name, display_order) VALUES ('New Supplier', 7);
```

Choose a `display_order` number to control where it appears on screen (lower = higher up).

---

## How to add a new store

```sql
INSERT INTO stores (name, slug, brand_color, pin)
VALUES ('Manchester City Centre', 'manchester-city-centre', '#4A235A', '3456');
```

Then update `src/app/login/[storeSlug]/page.tsx` to add the store name and colour to the `STORE_NAMES` and `STORE_COLORS` maps (those are used for the login page before the user is authenticated — the rest of the app reads from the database).

---

## Known limitations (v1)

- **PINs are stored as plain text.** Fine for internal use but should be hashed (e.g. bcrypt) before v2 if the Supabase project is ever made more public.
- **No admin UI.** Items, suppliers, and PINs must be managed via SQL. An admin panel is stubbed out at `/app/admin` for a future version.
- **No push notifications or low-stock alerts.** The order list is manual — someone has to open the Orders tab.
- **No offline support.** The app requires an internet connection to save counts.
- **No audit log.** `counted_by` records who made the last change but there's no history of edits.
- **Sessions last 30 days.** After that, staff will be asked to re-enter the PIN.
- **RLS is permissive within a session.** Any authenticated user can read all stores' counts. Staff can only write to their own store, but they can see the other store's data in the Dashboard.

---

*Built with Next.js 15, Supabase, and Tailwind CSS v4.*
