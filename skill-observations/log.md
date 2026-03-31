# Skill Observation Log

Observations captured during task-oriented work. Each entry identifies a
potential skill improvement or new skill opportunity.

**Status key:** OPEN = not yet actioned | ACTIONED = skill updated/created | DECLINED = user decided not to pursue

---

## 2026-03-29

### Observation 1: Fire-and-forget async patterns silently swallow notification errors

**Date:** 2026-03-29
**Session context:** Backend hardening pass — 7 tasks covering rate limiting, account deletion, session validation, notification reliability, Stripe dunning, club invites, feed algorithm
**Skill:** New skill candidate: backend-api-patterns
**Type:** internal
**Phase/Area:** Error handling in async notification dispatch

**Issue:** Two API routes (reviews, friend-recommendations) used fire-and-forget IIFE or bare await patterns for notification inserts with either silent catch blocks or no error visibility. The reviews route had `} catch { // fire-and-forget — swallow errors silently }` which means notification failures would be invisible in production logs.

**Suggested improvement:** Add a project-level rule: all notification inserts must be wrapped in a try/catch that logs errors with a `[notifications]` prefix. The non-fatal nature is fine — what's not fine is silent failure. Pattern: `try { const { error } = await ...; if (error) console.error('[notifications] Insert failed:', error.message); } catch (err) { console.error('[notifications] Unexpected error:', err); }`.

**Principle:** Silent error swallowing in non-critical paths creates invisible production failures. Fire-and-forget is an acceptable reliability tradeoff; silent error suppression is not. Always log non-critical failures even when not rethrowing them.

---

## 2026-03-30

### Observation 2: `export const dynamic` naming conflict with `next/dynamic` default import

**Date:** 2026-03-30
**Session context:** Bundle optimization pass — converting recharts in ProgressClient to a dynamic import via next/dynamic in the page file.
**Skill:** New skill candidate: backend-api-patterns (or a Next.js patterns internal skill)
**Type:** internal
**Phase/Area:** Dynamic imports in Next.js App Router server components

**Issue:** In Next.js App Router page files, `export const dynamic = 'force-dynamic'` is a reserved export name for the route segment config. Importing `next/dynamic` with `import dynamic from 'next/dynamic'` causes a TypeScript name collision — TS2440 "Import declaration conflicts with local declaration of 'dynamic'" — because both use the identifier `dynamic`. The import must be aliased (e.g., `import nextDynamic from 'next/dynamic'`) to avoid the conflict.

**Suggested improvement:** Add to Chapterly project notes: whenever using `next/dynamic` inside a page file that also has `export const dynamic = 'force-dynamic'`, always alias the import as `nextDynamic` or `dynamicImport`.

**Principle:** Next.js reserved export names (`dynamic`, `revalidate`, `fetchCache`, etc.) occupy the module scope and will conflict with any same-named import. Always alias `next/dynamic` in page/route files that also use the `dynamic` route segment config export.

---

## 2026-03-30

### Observation 3: XP update pattern — always read-then-write, never raw SQL increment

**Date:** 2026-03-30
**Session context:** Daily quests system — building /api/quests POST handler that awards XP on quest completion
**Skill:** internal — Chapterly backend patterns
**Type:** internal
**Phase/Area:** XP mutation in API routes

**Issue:** When first drafting the quests POST route, used a convoluted approach with `supabase.rpc('increment_user_xp', ...)` which doesn't exist in the schema, plus a series of messy fallbacks. The correct established pattern (already in `/api/xp/award/route.ts`) is: fetch `total_xp` + `reader_level` with `.maybeSingle()`, compute new values using `levelFromXP()` from `src/lib/xp.ts`, then write both columns back in a single `.update()` call.

**Suggested improvement:** Add to Chapterly project notes: the canonical XP increment pattern is read-compute-write using `levelFromXP` from `src/lib/xp.ts`. No RPC needed. Reference: `src/app/api/xp/award/route.ts` as the authoritative example for any new route that awards XP.

**Principle:** When an established pattern already exists in the codebase for a common operation (like incrementing XP), read that reference file before drafting the new implementation. Avoids inventing unnecessary abstractions (RPC calls) that don't match the actual DB schema.

---

## 2026-03-31

### Observation 4: Upstash Redis placeholder URL bypasses null guard and crashes build

**Date:** 2026-03-31
**Session context:** Weakness analyzer improvements — rate limiting via Upstash Redis added to API routes. Build failed during page data collection phase.
**Skill:** internal — Chapterly backend patterns
**Type:** internal
**Phase/Area:** Optional dependency initialization with env var placeholders

**Issue:** `src/lib/rate-limit.ts` initialized the Redis client inside a guard `if (!url || !token)`. The `.env.local` file had placeholder values `UPSTASH_REDIS_REST_URL=your_upstash_redis_url` (non-empty strings). The null check passed, the Redis client was instantiated with an invalid URL, and Next.js threw `UrlError: Upstash Redis client was passed an invalid URL` during build's page data collection phase — causing the entire build to fail.

**Suggested improvement:** For any optional SDK that validates its config at construction time, guard with a content check, not just a presence check. For URL-typed config: `!url.startsWith('https://')`. Applied fix: `if (!url || !token || !url.startsWith('https://')) return null`.

**Principle:** Placeholder env var values (e.g. `your_api_key_here`) are non-empty strings that pass truthy/falsy checks. Any SDK that validates at construction time will throw, not at the guard, but deep in the call stack — making the error hard to trace. Always validate that env vars contain _valid_ values, not merely that they exist. For URLs: check the scheme. For tokens: check minimum length or prefix format.

---

### Observation 5: Supabase CLI loses migration history when migrations were applied manually

**Date:** 2026-03-31
**Session context:** Setting up Supabase CLI (`supabase db push`) to automate future migrations. CLI tried to re-apply all 17 migration files including the 15 already applied manually via SQL Editor.
**Skill:** internal — Chapterly backend patterns
**Type:** internal
**Phase/Area:** DB migration tooling setup

**Issue:** `supabase db push` uses a `supabase_migrations` tracking table to know which migrations have been applied. When migrations are applied manually (via Supabase SQL Editor or direct psql), this table is never populated. The CLI has no record of prior migrations and attempts to apply all of them from scratch, failing immediately on duplicate objects (tables, policies that already exist).

**Suggested improvement:** For Chapterly: new migrations should always be applied via `npm run db:push` (which reads `SUPABASE_ACCESS_TOKEN` from `.env.local`). The Supabase Management API (`POST /v1/projects/{ref}/database/query`) is the reliable fallback when the CLI's migration state is mismatched — it executes SQL directly with no tracking dependencies. For future projects: set up `supabase link` before applying the first migration so all history is tracked from day one.

**Principle:** Migration tracking tools only know what they applied themselves. Any out-of-band SQL execution (manual SQL Editor, psql, API calls) creates a state divergence that will surface the next time the tool runs. Either commit to the tool from migration #1, or use the raw API as the escape hatch when state is already diverged.

---

### Observation 6: Multi-agent parallel runs hit Anthropic rate limits mid-task, leaving partial work

**Date:** 2026-03-31
**Session context:** Three background agents launched in parallel — settings/onboarding/quests/push/tests, frontend improvements, and backend hardening. Two agents returned "You've hit your limit · resets 1am" with very low token counts (450 and 1,770 tokens), indicating they were cut off almost immediately.
**Skill:** New skill candidate: multi-agent orchestration patterns
**Type:** internal
**Phase/Area:** Parallel agent launch strategy and rate limit handling

**Issue:** Launching 3 large agents simultaneously triggered Anthropic API rate limits. Two agents returned immediately with a rate limit message, meaning their work was never done — but the orchestrator assumed all three had completed work and moved on. This left a large number of tasks in an indeterminate state that required manual audit to determine what had actually been completed.

**Suggested improvement:** When launching multiple background agents in parallel, stagger them or use at most 2 concurrent large agents. After receiving completion notifications, always check token counts in the result — a result with <5,000 tokens from a complex agent likely indicates a rate limit abort, not successful completion. Add an explicit audit step: before marking tasks complete from agent results, verify key output files actually exist on disk.

**Principle:** Agent completion notifications confirm the agent process ended, not that it succeeded. Rate-limited agents return a shell result with near-zero token usage. Always cross-reference agent output claims against actual file system state before declaring tasks complete — especially when agents ran in parallel and rate limits are a factor.
