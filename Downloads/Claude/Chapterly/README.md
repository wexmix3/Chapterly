# 📖 Chapterly

**Track, Share, Read More.**

The most shareable, habit-forming reading log — built to outcompete Goodreads, The StoryGraph, and Bookly.

**Project location:** `C:\Users\maxmw\Downloads\Claude\Chapterly`

---

## Quick Start (Windows)

### Prerequisites

- [Node.js 18+](https://nodejs.org/) installed
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google Cloud Console](https://console.cloud.google.com) project (for OAuth)
- A [Vercel](https://vercel.com) account (for deployment)

### 1. Open Terminal in Project Folder

```powershell
cd C:\Users\maxmw\Downloads\Claude\Chapterly
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** → paste the contents of:
   ```
   C:\Users\maxmw\Downloads\Claude\Chapterly\supabase\migrations\001_initial_schema.sql
   ```
   → Click **Run**
3. Go to **Authentication → Providers → Google** → Enable it
4. Copy your **Project URL** and **anon key** from **Settings → API**

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create **OAuth 2.0 Client ID** (Web application)
3. Add authorized redirect URI:
   ```
   https://<YOUR_SUPABASE_PROJECT>.supabase.co/auth/v1/callback
   ```
4. Copy the Client ID and Secret into Supabase's Google provider settings

### 4. Configure Environment

```powershell
copy .env.local.example .env.local
```

Then edit `C:\Users\maxmw\Downloads\Claude\Chapterly\.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Locally

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Deploy to Vercel

```powershell
npx vercel --prod
```

Add the same env variables in Vercel's project settings (change `APP_URL` to your Vercel URL).

---

## Project Structure

```
C:\Users\maxmw\Downloads\Claude\Chapterly\
├── .env.local.example          ← Copy to .env.local, fill in keys
├── package.json                ← Dependencies
├── next.config.js              ← Next.js config
├── tailwind.config.ts          ← Brand colors + custom animations
├── vercel.json                 ← Deployment config
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  ← Run in Supabase SQL Editor
│
└── src/
    ├── app/                    ← Pages & API routes
    │   ├── page.tsx            ← Landing page
    │   ├── layout.tsx          ← Root layout + fonts
    │   ├── globals.css         ← Brand styles
    │   ├── login/page.tsx      ← Google OAuth login
    │   ├── onboarding/page.tsx ← Import + goal setting
    │   ├── dashboard/page.tsx  ← Main app (tabbed)
    │   └── api/
    │       ├── books/search/   ← Dual-source book search
    │       ├── user-books/     ← Shelf CRUD
    │       ├── sessions/       ← Reading session logging
    │       ├── stats/          ← Stats computation
    │       ├── social/         ← Follow/unfollow
    │       └── auth/callback/  ← OAuth callback
    │
    ├── components/
    │   ├── layout/Navigation.tsx      ← Sidebar + mobile nav
    │   ├── books/BookSearch.tsx        ← Search with shelf picker
    │   ├── books/BookShelf.tsx         ← Cover grid with tabs
    │   ├── books/GoodreadsImport.tsx   ← CSV drag-and-drop import
    │   ├── dashboard/StatsOverview.tsx ← 6 stat cards with streak glow
    │   ├── sessions/QuickLog.tsx       ← One-tap pages/minutes logger
    │   └── share/ShareCardPreview.tsx  ← 3 card types × 4 themes
    │
    ├── hooks/index.ts          ← useAuth, useShelf, useStats, etc.
    ├── lib/
    │   ├── supabase.ts         ← Browser/server/admin clients
    │   ├── books.ts            ← Open Library + Google Books search
    │   ├── stats.ts            ← Streak calculator + stats aggregation
    │   ├── import.ts           ← Goodreads CSV parser
    │   └── shareCards.ts       ← Card themes + formatters
    ├── types/index.ts          ← All TypeScript interfaces
    └── middleware.ts           ← Auth route protection
```

## What's Built (MVP)

| Feature | Description |
|---------|-------------|
| **Google OAuth** | One-click sign in, auto profile creation |
| **Book Search** | Dual-source (Open Library + Google Books), deduplicated |
| **Shelf Management** | To Read / Reading / Read / DNF with cover grid |
| **One-Tap Logging** | Pages or minutes, presets, optional notes |
| **Smart Streaks** | Forgiving streaks (protection unlocks at 3 days) |
| **Stats Dashboard** | 6 cards: streak, books, year, pages, time, avg rating |
| **Share Cards** | 3 types (Now Reading, Streak, Recap) × 4 color themes |
| **Goodreads Import** | CSV parser with progress bar, drag-and-drop |
| **Onboarding** | Welcome → Import → Goal → Dashboard |
| **Mobile-First** | Bottom nav on mobile, sidebar on desktop |
| **Secure by Default** | Supabase RLS on every table |

## What to Build Next

1. **V1 (months 1-3):** Social feed, reading challenges, book clubs, public profile pages
2. **V2 (months 4-8):** Public API, algorithmic + trust-graph recs, safety tools, Year Wrapped
3. **V3 (months 9-12):** Affiliate links, publisher tools, audio/podcast tracking

---

Built with Next.js 14, Supabase, Vercel, Tailwind CSS, and Lucide icons.
