# Chapterly — Claude Code Project Instructions

## Orchestration
For any non-trivial request, invoke the **Master Orchestrator** agent first. It will analyze the request, select the right specialist agents, sequence the work, and handle all handoffs automatically. Never ask the user which agent to use.

## Task Observer
At the start of any task-oriented session (multi-step work using tools), invoke the task-observer skill.

## Project Overview
- **Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS, Supabase (Auth + Postgres + RLS), lucide-react, date-fns
- **Location:** `C:/Users/maxmw/Downloads/Claude/Chapterly/`

## Critical Rules

### Supabase Client Split
- `src/lib/supabase.ts` — browser only (no next/headers). Use in client components.
- `src/lib/supabase-server.ts` — server/API routes only (uses next/headers). Use in route handlers.
- These CANNOT be merged into one file.

### API Routes
- ALL API routes must have `export const dynamic = 'force-dynamic'` at the top to avoid prerender errors.

### Supabase Queries
- Use `.maybeSingle()` (not `.single()`) whenever a query may return zero rows. `.single()` throws PGRST116 on no results.

### Type Imports
- Use `SupabaseClient` from `@supabase/supabase-js` as parameter type in lib functions. `ReturnType<typeof createClient>` resolves to `never` for DB table types.

### Auth
- Google OAuth via Supabase. `createBrowserSupabaseClient` in client components; `createRouteHandlerClient` from `@supabase/auth-helpers-nextjs` in API routes.
- `@supabase/auth-helpers-nextjs` is deprecated — use `createRouteHandlerClient`, not `createServerClient`.

### Landing Page
- `src/app/page.tsx` needs `export const dynamic = 'force-dynamic'` since it checks auth at render time.

## DB Schema
Run `supabase/migrations/001_initial_schema.sql` manually in Supabase SQL Editor.
Tables: users, books, user_books, sessions, stats_daily, social_follow, share_cards, reading_challenges. All with RLS.
