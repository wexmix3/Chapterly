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

---

## 2026-04-02

### Observation 14: Recharts Legend inside PieChart steals vertical space and can make the chart invisible

**Date:** 2026-04-02
**Session context:** Fixing Genre Distribution pie chart on the Progress page — user reported "nothing shows up"
**Skill:** internal — Chapterly charting patterns
**Type:** internal
**Phase/Area:** Recharts PieChart layout

**Issue:** The Genre Distribution `<PieChart>` had `height={160}` and included both `<Pie>` (innerRadius=45, outerRadius=65 — needs ~130px) and `<Legend>`. Recharts PieChart reserves legend height first, then gives the remainder to the pie. With up to 6 long OpenLibrary subject strings as genre names, the legend consumed 60-80px, leaving the pie with 80-100px — less than its minimum 130px — making it invisible. Additionally, `<Customized>` does not receive `cx`/`cy` props in PieChart context (only CartesianChart does), so the center label fell back to hardcoded position (80, 80) regardless of actual pie center.

**Suggested improvement (applied):** Remove `<Legend>` and `<Customized>` from the PieChart entirely. Use a `position: relative` wrapper with an absolute-positioned HTML div overlay for the center label (reliable, respects dark mode, no SVG quirks). Add a custom 2-column HTML grid legend below the chart with names truncated to 20 chars. The pie now owns its full container height.

**Principle:** Never put `<Legend>` inside a Recharts `<PieChart>` with a constrained height — it silently shrinks the pie's rendering area. For donut center labels, HTML absolute overlays are more reliable than `<Customized>` (which receives different props per chart type). Always render legends as HTML elements alongside the chart rather than inside it when height is limited.

---

### Observation 15: Hardcoded SVG fill colors in recharts custom tick renderers are invisible in dark mode

**Date:** 2026-04-02
**Session context:** Fixing dark mode UX — some components hard to see when toggling light/dark
**Skill:** internal — Chapterly dark mode patterns
**Type:** internal
**Phase/Area:** Recharts chart axis labels / globals.css dark mode overrides

**Issue:** The author breakdown bar chart's YAxis used a custom tick renderer with `style={{ fill: '#111827' }}` — near-black. In dark mode, the card background becomes `ink.900` (~#3d3d3d), making the near-black text invisible. Recharts SVG fills are inline styles and are not affected by the global CSS dark mode overrides in globals.css (which only target Tailwind class-based colors). Also, globals.css was missing dark overrides for `border-paper-*` (used in stat detail sheet dividers) and all colored accent backgrounds (`bg-amber-50`, `bg-blue-50`, `bg-emerald-50`, etc.) — these stayed as light pastels on dark modal backgrounds, creating harsh contrast.

**Suggested improvement (applied):** Add `isDark` state to ProgressClient with a MutationObserver watching `document.documentElement` class attribute changes, so it reactively updates when the user toggles the theme. Pass `isDark` into recharts inline styles: `fill: isDark ? '#d1d5db' : '#111827'`. Add CSS overrides in globals.css for `border-paper-*`, and all colored accent classes (amber, emerald, blue, purple, orange, rose, cyan backgrounds, borders, and text).

**Principle:** Tailwind's dark mode class approach (via globals.css overrides) only covers Tailwind utility classes — it cannot reach inline SVG fill/stroke attributes in recharts custom renderers. For any recharts component using custom tick/label renderers with inline fill colors, add a reactive `isDark` state via MutationObserver and conditionally set the fill. This is the only reliable way to keep chart labels legible across theme switches.

---

## 2026-04-03

### Observation 16: Supabase RLS silently drops writes — success counters before error checks are misleading

**Date:** 2026-04-03
**Session context:** Debugging genre distribution chart not populating despite backfill endpoint reporting 48 books classified
**Skill:** internal — Chapterly Supabase patterns
**Type:** internal
**Phase/Area:** books table RLS / admin client usage

**Issue:** The backfill endpoint reported `filled: 48` but no subjects were actually written to the `books` table. The bug: `filled++` was placed after `await supabase.from('books').update(...)` but before checking the returned `error` object. Since the `books` table has RLS enabled with no UPDATE policy for authenticated users (only `user_books` has `ub_update`), every write silently returned an error that was never checked. The `createServerSupabaseClient` (user session) cannot update shared tables without explicit RLS policies.

**Suggested improvement (applied):** Use `createAdminSupabaseClient()` (service role key, bypasses RLS) for any writes to shared tables like `books`. Always destructure `{ error }` from Supabase writes and only increment counters/return success after confirming `!error`.

**Principle:** Supabase RLS silently rejects unauthorized writes — no exception is thrown, just `{ data: null, error: { message: '...' } }`. Never assume a Supabase write succeeded without checking the error object. For writes to shared/non-user-owned tables (like a global `books` catalog), always use the admin client (service role). The user session client can only write to rows it owns per RLS policy.

---

### Observation 17: External book metadata APIs have very sparse category/subject data

**Date:** 2026-04-03
**Session context:** Attempting to backfill book subjects from OpenLibrary and Google Books for genre distribution chart
**Skill:** internal — Chapterly book metadata patterns
**Type:** internal
**Phase/Area:** Subject backfill strategy

**Issue:** 54 books were attempted via direct OpenLibrary works endpoint and Google Books volume endpoint. 0 returned subjects via direct lookup. A title+author Google Books search fallback got 1/54. External book metadata APIs return categories/subjects for only a small fraction of books. OpenLibrary subjects are inconsistent and often missing; Google Books categories are sparse outside bestsellers.

**Suggested improvement (applied):** Use Claude Haiku to classify genre from title + author when external APIs fail. Batch 10 books per Claude call (stays under Vercel 10s function timeout). The genres endpoint now self-heals: on each page load it classifies up to 10 untagged books and persists them via admin client. No manual backfill URL needed going forward.

**Principle:** For book metadata (genre, subjects, categories), external APIs are unreliable fallbacks — treat them as a nice-to-have, not a dependency. LLM classification from title+author is more reliable, cost-effective (Haiku is cheap), and produces standardized genre labels. Build self-healing data pipelines that enrich missing data incrementally on each request rather than requiring manual one-shot backfills.

---

### Observation 18: `current_page = 0` in DB passes `!= null` check and shows wrong page count in modal

**Date:** 2026-04-03
**Session context:** User reported that read books show 0/71 pages instead of 71/71 in shelf modal
**Skill:** internal — Chapterly user_books UI patterns
**Type:** internal
**Phase/Area:** BookShelf modal initialization

**Issue:** The modal initializes `currentPage` with `if (userBook.current_page != null) return String(userBook.current_page)`. When `current_page` is `0` in the DB (default for books added before the auto-set logic), `0 != null` is `true`, so it returns `"0"` rather than falling through to the `status === 'read' && book?.page_count` default. Result: read books with no logged pages show `0/71` instead of `71/71`.

**Suggested improvement (applied):** Changed `!= null` to truthiness check (`if (userBook.current_page)`), so `0` is treated as unset and falls through to the page_count default for read books. Also added a `resolvedPage` fallback in `handleSave` so saving a read book with empty/0 page input automatically persists `page_count`.

**Principle:** When a numeric DB column defaults to `0` rather than `null`, `!= null` checks pass for the zero case and treat it as a real value. Use truthiness checks (`if (value)`) when `0` should be treated as "not set". This is especially important for progress/page count fields where `0` means "never logged" not "literally zero pages".
