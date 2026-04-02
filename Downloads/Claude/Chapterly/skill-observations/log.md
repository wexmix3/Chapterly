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

---

## 2026-03-31

### Observation 7: Recharts PieChart center label requires Customized layer — not direct SVG children

**Date:** 2026-03-31
**Session context:** Genre distribution chart bug fix — donut center label was not rendering.
**Skill:** internal — Chapterly frontend patterns
**Type:** internal
**Phase/Area:** Recharts donut chart implementation

**Issue:** The `GenreDonutCenter` component was placed as a direct child of `<Pie>` in JSX (outside the `{data.map(...)}` children), but recharts Pie does not accept arbitrary React children for overlay rendering. The center label rendered with `cx={undefined}` and `cy={undefined}` because recharts does not inject those props onto arbitrary children. The component appeared to exist in the DOM but rendered at 0,0 and was invisible.

**Suggested improvement:** For donut center labels in recharts, use the `<Customized>` component from recharts — it receives the chart's layout props (including `cx`, `cy`) via its `component` render prop. Pattern: `<Customized component={(props) => <MyLabel viewBox={{ cx: props.cx, cy: props.cy }} />} />` placed as a sibling of `<Pie>` inside `<PieChart>`.

**Principle:** Recharts charts do not pass layout geometry to arbitrary child components. Any overlay element that needs chart coordinates (cx, cy, width, height) must use the `Customized` layer — not direct JSX children of chart primitives like `Pie`, `Bar`, or `Line`.

---

## 2026-03-31

### Observation 8: Recharts YAxis tick fill is overridden by CSS — use custom render function

**Date:** 2026-03-31
**Session context:** Author distribution chart in ProgressClient — author names not visible on YAxis labels.
**Skill:** internal — Chapterly frontend patterns
**Type:** internal
**Phase/Area:** Recharts horizontal bar chart YAxis

**Issue:** `tick={{ fontSize: 11, fill: '#374151' }}` passes `fill` as an SVG attribute on the default Recharts Text component. In Next.js + Tailwind environments, CSS `color` inheritance or Preflight resets can override SVG attribute-level fill, making axis labels invisible against the white background.

**Suggested improvement:** Replace the `tick` object prop with a custom render function that returns an explicit `<text>` SVG element using `style={{ fill: '#111827' }}` (CSS property, not SVG attribute). Also remove `tickFormatter` from the `YAxis` and handle truncation inside the custom render function to avoid prop conflicts.

**Principle:** SVG attribute `fill` has lower cascade priority than CSS `fill` or `color` applied by stylesheets. When Recharts tick labels are invisible, switch from `tick={{ fill: '...' }}` to a custom tick component using inline `style={{ fill: '...' }}` — CSS inline styles always win over SVG presentation attributes.

---

### Observation 9: AI Claude JSON responses need greedy extraction, not just markdown strip

**Date:** 2026-03-31
**Session context:** AI recommendations returning "temporarily unavailable" despite Claude responding.
**Skill:** internal — Chapterly AI route patterns
**Type:** internal
**Phase/Area:** `/api/ai/recommend` JSON parsing

**Issue:** The recommendation API stripped backtick fences with a regex (`/^```(?:json)?\s*/i`) but Claude sometimes prepends a sentence before the JSON block (e.g., "Here are your recommendations:"), causing `JSON.parse` to throw on the leading text. This landed in the catch block and returned the "temporarily unavailable" message.

**Suggested improvement:** Extract the JSON object by searching for the outermost `{...}` containing the expected key using a greedy regex: `raw.match(/\{[\s\S]*"recommendations"[\s\S]*\}/)`. This finds the JSON block regardless of leading/trailing prose. Apply this pattern to all AI routes that parse structured JSON from Claude.

**Principle:** Claude model responses to structured-output prompts frequently include preamble or postamble text even when instructed not to. Never assume the raw response IS the JSON — always extract the JSON object or array by content-matching regex rather than by trimming edge whitespace.

---

### Observation 10: Genre distribution requires subject backfill — stats route must trigger it

**Date:** 2026-03-31
**Session context:** Genre distribution section showing blank on dashboard stats cards.
**Skill:** internal — Chapterly data pipeline patterns
**Type:** internal
**Phase/Area:** Stats computation / subject enrichment

**Issue:** `computeUserStats` computes `top_genres` from `books.subjects`, but many books are stored without subjects (Google Books `categories` is frequently empty). The backfill that fetches subjects from Open Library / Google Books only runs inside `/api/stats/rich` (the progress page). Users who never visit the progress page never get their genres populated.

**Suggested improvement:** In `StatsOverview`, after stats load, check if `top_genres.length === 0` and `total_books_read > 0`. If so, fire a background call to `/api/stats/rich` which triggers the backfill and persists subjects to the DB. After it returns with populated genres, call `refetch()`. This is a one-time self-healing pattern — subsequent loads serve genres from the DB.

**Principle:** Data enrichment that only runs on one page creates invisible gaps for users who never visit that page. When a derived stat can be empty due to missing source data, the component rendering that stat should self-heal by triggering the enrichment endpoint in the background rather than silently showing nothing.

---

### Observation 11: Boolean flag defaults silently exclude users from global queries

**Date:** 2026-04-01
**Session context:** Leaderboard bug — global tab showed only the current user, not all readers.
**Skill:** internal — Chapterly API patterns
**Type:** internal
**Phase/Area:** Leaderboard API / scope filtering

**Issue:** `/api/leaderboard` filtered global results to users with `is_public = true`. Since the DB default for `is_public` was never explicitly set to `true`, all users (including the current user's followed users) were excluded from the global leaderboard. The result: only the current user appeared, because they had the flag set or were always included via self-reference. The bug was invisible in dev since no other test accounts existed.

**Suggested improvement:** For leaderboard-style queries (ranked public feeds), do not filter by opt-in privacy flags unless there's a deliberate privacy model requiring explicit opt-in. If privacy filtering is desired, default the column to `true` in the migration. Remove the `is_public` filter from all three leaderboard query branches.

**Principle:** Boolean flag filters (`WHERE is_public = true`, `WHERE is_active = true`) silently empty result sets when the flag was never explicitly set. Always audit whether a column default matches the intended query behavior before using it as a filter — a missing default on a boolean privacy flag will make all users invisible to queries that depend on it.

---

## 2026-04-01

### Observation 12: "Already implemented" features can still have data pipeline gaps

**Date:** 2026-04-01
**Session context:** Implementing 4 pending weakness analyzer fixes (M15–M20)
**Skill:** internal — Chapterly feature implementation patterns
**Type:** internal
**Phase/Area:** Feature audit / implementation validation

**Issue:** M15 (feed book cover thumbnails) appeared pending but was already implemented in both the API (feed/route.ts returns `book_cover: ub.books?.cover_url`) and the UI (FeedCard renders thumbnails at lines 528–541). However, the underlying data gap — books stored without `cover_url` because subjects/metadata weren't fully fetched at import time — means the feature may appear to not work for some users even though the code is correct.

**Suggested improvement:** When confirming a feature as "already implemented", also verify the data pipeline is complete — i.e., that the underlying DB columns are actually populated for a representative set of records. A code audit alone can miss silent data gaps.

**Principle:** Code correctness and data availability are separate concerns. A feature can be correctly implemented in code but silently non-functional because the data it depends on is sparse in the DB. "Feature is implemented" should mean both the code path and the data pipeline are complete.

---

### Observation 13: Genre personalization needs graceful degradation for new users

**Date:** 2026-04-01
**Session context:** Implementing M16 — personalize discover page by user genre preferences
**Skill:** internal — Chapterly recommendations patterns
**Type:** internal
**Phase/Area:** /api/recommendations — genre derivation

**Issue:** The recommendations API only derived genres from shelf books' subjects. New users who just completed onboarding have genre preferences stored in `users.genres` but zero shelf books, so they got an empty recommendations response and saw no "Because you read X" section on discover.

**Suggested improvement:** Applied — API now fetches `users.genres` in parallel with shelf query and merges onboarding genres as fallback when shelf-derived genres are sparse (fewer than 3). Returns `userGenres` in response so the UI can highlight preferred genres.

**Principle:** User preference data collected at onboarding (genres, goals, interests) should be used as a fallback signal in all personalization features, not just onboarding flows. When shelf history is sparse (new users), stored preferences are the only personalization signal available and should be surfaced proactively.
