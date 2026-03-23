# Book Database API Research

Researched March 2026 for the Chapterly project.

---

## Current Chapterly Setup

Chapterly uses two APIs in parallel, implemented in `src/lib/books.ts`:

1. **Open Library** (primary) — `searchOpenLibrary()` queries `openlibrary.org/search.json`
2. **Google Books** (secondary / fallback) — `searchGoogleBooks()` queries `googleapis.com/books/v1/volumes`

Both are called in `Promise.allSettled`, results are merged and deduplicated by ISBN13 or `title-author` key.

The search route (`/api/books/search`) calls `searchBooks()` which runs both.

The preview route (`/api/books/preview`) uses Open Library for descriptions and cover fallbacks.

The AI recommendation routes (`/api/ai/recommend`, `/api/ai/mood`) use Google Books to enrich covers and descriptions.

**Verdict: the current dual-source setup is already the best free option.** No migration needed. Google Books key is present in `.env.local` and provides higher quality covers.

---

## API Comparison

### 1. Open Library API
- **URL:** https://openlibrary.org/developers/api
- **Database size:** 20+ million works, 30+ million editions (community-contributed, Internet Archive backed)
- **API key required:** No
- **Rate limits:** 1 req/sec unauthenticated; 3 req/sec with User-Agent header identifying your app
- **Cover images:** Available at `covers.openlibrary.org/b/id/{id}-L.jpg` or by ISBN. Quality is inconsistent — many older or obscure books lack covers, and resolution varies widely.
- **Search quality:** Good for ISBN lookup, acceptable for title/author search. Results can include duplicate editions and stub entries with minimal metadata.
- **Strengths:** Completely free, no key, huge catalogue, open data, great for ISBN resolution
- **Weaknesses:** Cover quality uneven, rate limits are strict for production use, some metadata sparse
- **Best for:** ISBN lookups, bulk/offline data, breadth of catalogue

### 2. Google Books API
- **URL:** https://developers.google.com/books/docs/v1/using
- **Database size:** 40+ million volumes (Google does not publish an exact figure; estimated from Google's book scanning project)
- **API key required:** Optional for read-only public search. Required for higher quota and private shelves.
- **Rate limits:** 1,000 requests/day free without key; ~1,000 requests/day per project without quota increase (default). Quota increase can be requested via Google Cloud Console. With key you get up to 1,000/day by default, more via quota request.
- **Cover images:** High quality thumbnails available via `imageLinks.thumbnail` (replace `http:` with `https:`). Better coverage than Open Library for modern books, publisher-provided artwork.
- **Search quality:** Excellent. Supports `intitle:`, `inauthor:`, `isbn:` operators. Publisher-vetted metadata. Much better for bestsellers, modern titles, and international books.
- **Strengths:** Best cover quality, excellent search, large modern catalogue, works without a key at low volume
- **Weaknesses:** 1,000 req/day default limit is tight for production; some academic/niche titles missing
- **Best for:** Cover enrichment, recommendation display, modern fiction/nonfiction

### 3. Hardcover API
- **URL:** https://docs.hardcover.app/api/getting-started/
- **Database size:** Not publicly documented. Community-sourced database, smaller than Google/OL but high-quality curation by book enthusiasts.
- **API key required:** Yes — bearer token, obtained from your Hardcover account settings
- **Rate limits:** 60 requests/minute
- **Protocol:** GraphQL (same API used by Hardcover's web, iOS, and Android apps)
- **Cover images:** Generally good quality for popular books. Note: loading many cover URLs simultaneously can trigger rate limiting on image CDN.
- **Search quality:** Strong for popular fiction and community-rated books. Rich data: ratings distributions, user read counts, community tags, series info.
- **Strengths:** Goodreads-alternative community data (ratings, reviews, series info), modern tech (GraphQL), active development
- **Weaknesses:** Requires account/key, beta API, smaller database than Google Books, cover CDN rate limits on bulk load
- **Best for:** Social features, community ratings, series/series-order data, Goodreads replacement data

### 4. ISBNdb
- **URL:** https://isbndb.com
- **Database size:** 108+ million titles (largest ISBN-focused database available via API)
- **API key required:** Yes — paid subscription required
- **Pricing:** $14.95/month (Basic), $29.95/month (Standard), $74.95/month (Premium). Academic plan $5/month with 2,000 calls/day limit. 7-day free trial.
- **Rate limits:** Varies by plan. Basic plan: limited daily calls.
- **Cover images:** Not a strength — ISBNdb focuses on bibliographic data (ISBN, title, author, publisher, binding, language) rather than cover imagery.
- **Search quality:** Best for ISBN-based lookups and bibliographic accuracy. Not optimized for keyword search.
- **Strengths:** Largest ISBN database, excellent for ISBN13/ISBN10 resolution, international coverage, publisher/binding data
- **Weaknesses:** Paid only, no free tier to speak of, covers are weak, overkill for most reading tracker apps
- **Best for:** Production apps needing guaranteed ISBN resolution at scale, e-commerce, library systems

### 5. Other Alternatives

**Bookshelf-style apps / community APIs:**
- **Goodreads:** Removed public API in 2020. No longer available.
- **LibraryThing:** Has an API but requires membership key; smaller developer community.
- **The StoryGraph:** No public API as of 2026.
- **Inventaire (inventaire.io):** Open-source Wikidata-backed book database. Free, no key, supports linked data. Smaller catalogue but interesting for niche/literary titles.

---

## Recommendation for Chapterly

**Current setup is already optimal.** The dual Open Library + Google Books approach covers the key tradeoffs:

| Need | Source |
|------|--------|
| Free, no-key operation | Open Library |
| Best cover images | Google Books |
| ISBN resolution | Both (OL slightly better) |
| Modern bestsellers search | Google Books |
| Broad catalogue | Open Library |

**One improvement worth making:** The `GOOGLE_BOOKS_API_KEY` is already set in `.env.local`. The key is used in the AI recommendation routes but the search route (`src/lib/books.ts`) also picks it up via `process.env.GOOGLE_BOOKS_API_KEY`. This means you're already getting authenticated Google Books requests with higher quota.

**If you hit the 1,000/day Google Books limit in production:** Request a quota increase via Google Cloud Console — it's free for Books API and typically approved. Alternatively, add ISBNdb as a third fallback for ISBN lookups only (the $14.95/month plan is reasonable for production).

**Hardcover is worth watching** as a supplemental data source for community features (series info, ratings distributions, tags), but the beta status and rate limits on cover images make it unsuitable as a primary book database right now.

---

## API Routes in Chapterly

| Route | APIs Used |
|-------|-----------|
| `GET /api/books/search?q=` | Open Library + Google Books (parallel, merged) |
| `GET /api/books/preview` | Supabase DB + Open Library (description/workId) |
| `POST /api/ai/recommend` | Google Books (cover enrichment only; Claude generates titles) |
| `POST /api/ai/mood` | Google Books (cover enrichment only; Claude generates titles) |
