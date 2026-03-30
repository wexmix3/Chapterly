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
