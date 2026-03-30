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

## Web App Build Patterns

### API retry logic for Anthropic calls
All `anthropic.messages.create()` calls must use `createMessageWithRetry` from `src/lib/ai-retry.ts`. Retries up to 3 attempts on 429 (rate limit) and 529 (overloaded) with 1.5s then 3s delays. Non-retryable errors (400, 401) throw immediately. Never deploy an AI feature without this.

### Match model to task
- Text analysis, summarization, structured extraction → `claude-haiku-4-5-20251001` (current default — correct)
- Complex multi-step reasoning → `claude-sonnet-4-6`
- Never use Opus for text analysis. Never add adaptive thinking to structured output tasks.

### Cross-cutting principles
Mandatory checklist for all code changes: `skill-observations/cross-cutting-principles.md`

## Automation Layer — When to Use What

Before designing or building any automation, background job, or webhook handler, classify which layer is right:

**Use n8n when:**
- Connecting SaaS tools (email, Stripe webhooks, Supabase with simple logic)
- Simple trigger → condition → action patterns, under ~8 nodes
- The workflow needs to be visible/explainable to someone non-technical

**Use Trigger.dev or Vercel serverless when:**
- The agent decides how many iterations to run (agentic loops)
- Long-running jobs (>30 seconds)
- Complex retry logic that would need 3+ custom Code nodes in n8n
- The output is a Chapterly feature (not a client automation)
- Version control and testability matter

**Two forcing questions:**
1. Would I need 3+ custom Code nodes to handle the logic in n8n? If yes → code.
2. Does the workflow decide how many steps to take, or is step count fixed? If the agent decides → code.
