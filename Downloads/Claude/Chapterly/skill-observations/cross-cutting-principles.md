# Cross-Cutting Principles

Chapterly-specific principles that apply across all development. Read as a mandatory checklist when making any code changes.

---

## Active Principles

### 1. Use `.maybeSingle()` not `.single()` for nullable Supabase queries
**Added:** 2026-03-29
**Applies to:** All Supabase queries
**Requirement:** Use `.maybeSingle()` whenever a query may return zero rows. `.single()` throws PGRST116 on no results and causes 500 errors in production.
**Propagation:** immediate
**Status:** active

### 2. All API routes need `export const dynamic = 'force-dynamic'`
**Added:** 2026-03-29
**Applies to:** All Next.js API route handlers (`src/app/api/**/route.ts`)
**Requirement:** Add `export const dynamic = 'force-dynamic'` as the very first line of every route.ts file. Without it, Next.js tries to prerender the route at build time, causing build failures.
**Propagation:** immediate
**Status:** active

### 3. Use `SupabaseClient` type from `@supabase/supabase-js` in lib functions
**Added:** 2026-03-29
**Applies to:** All lib functions (`src/lib/**`) that accept a Supabase client as a parameter
**Requirement:** Import and use `SupabaseClient` from `@supabase/supabase-js` as the parameter type — NOT `ReturnType<typeof createClient>`, which resolves to `never` for DB table types and breaks TypeScript inference.
**Propagation:** immediate
**Status:** active

### 4. All Anthropic API calls must use retry logic
**Added:** 2026-03-29
**Applies to:** All API routes that call the Anthropic SDK (`src/app/api/ai/**`)
**Requirement:** Use `createMessageWithRetry` from `src/lib/ai-retry.ts` instead of calling `anthropic.messages.create()` directly. This retries on 429 (rate limit) and 529 (overloaded) with 1.5s then 3s delays, up to 3 attempts. Non-retryable errors (400, 401) must not be retried.
**Propagation:** immediate
**Status:** active

### 5. Supabase browser/server client split must be maintained
**Added:** 2026-03-29
**Applies to:** All code that imports Supabase
**Requirement:** `src/lib/supabase.ts` is browser-only (no next/headers import). `src/lib/supabase-server.ts` is server/API-only (uses next/headers). Never import the server client in a client component (`'use client'`). Never merge these files.
**Propagation:** immediate
**Status:** active

### 6. Match model to task — never over-provision AI models
**Added:** 2026-03-29
**Applies to:** All AI feature implementation
**Requirement:** Default to `claude-haiku-4-5-20251001` for text analysis, summarization, and structured extraction (this is what all current routes use — correct). Only escalate to Sonnet for complex reasoning. Never use Opus for text analysis. Never add `thinking: { type: "adaptive" }` to structured analysis tasks with a defined output format.
**Propagation:** immediate
**Status:** active
