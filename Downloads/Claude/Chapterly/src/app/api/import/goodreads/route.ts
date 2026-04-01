export const dynamic = 'force-dynamic';

/**
 * POST /api/import/goodreads
 * Accepts a Goodreads export CSV (the "friends" export or the book export which
 * contains reviewer names), extracts unique author/reviewer names, then searches
 * for matching Chapterly users by display_name.
 *
 * Since Goodreads removed its public API in 2020, we work with CSV data the user
 * exports from their Goodreads account settings.
 *
 * Body: { csv: string }  — raw CSV text (max 500 KB)
 *
 * Returns: { matches: Array<{ goodreads_name, chapterly_user }> }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const MAX_CSV_BYTES = 500 * 1024; // 500 KB
const MAX_NAMES = 200;

/**
 * Parse a Goodreads book-export CSV and extract unique reviewer / friend names.
 * Goodreads book export columns (in order):
 * Book Id, Title, Author, Author l-f, Additional Authors, ISBN, ISBN13,
 * My Rating, Average Rating, Publisher, Binding, Number of Pages, Year Published,
 * Original Publication Year, Date Read, Date Added, Bookshelves,
 * Bookshelves with positions, Exclusive Shelf, My Review, Spoiler, Private Notes,
 * Read Count, Recommended For, Recommended By, Owned Copies, Original Purchase Date,
 * Original Purchase Location, Condition, Condition Description, BCID
 *
 * We extract the "Recommended By" column which contains friend names.
 * If the user pastes a friends-list CSV (Name, URL columns), we handle that too.
 */
function extractNamesFromCSV(csv: string): string[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  // Detect header
  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  // Case 1: Goodreads book export — look for "recommended by" column
  const recByIdx = header.findIndex(h => h.includes('recommended by'));
  if (recByIdx >= 0) {
    const names = new Set<string>();
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const name = cols[recByIdx]?.trim().replace(/^"|"$/g, '');
      if (name && name.length > 1) names.add(name);
    }
    return [...names].slice(0, MAX_NAMES);
  }

  // Case 2: Simple name list — first column is "Name" or just names
  const nameIdx = header.findIndex(h => h === 'name' || h === 'friend' || h === 'username');
  const colIdx = nameIdx >= 0 ? nameIdx : 0;

  const names = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const name = cols[colIdx]?.trim().replace(/^"|"$/g, '');
    if (name && name.length > 1 && !name.startsWith('http')) names.add(name);
  }
  return [...names].slice(0, MAX_NAMES);
}

/** Minimal CSV line parser — handles quoted fields with commas. */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { csv?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const csv = body.csv ?? '';
  if (!csv.trim()) {
    return NextResponse.json({ error: 'csv field is required' }, { status: 400 });
  }
  if (csv.length > MAX_CSV_BYTES) {
    return NextResponse.json({ error: 'CSV too large (max 500 KB)' }, { status: 413 });
  }

  const names = extractNamesFromCSV(csv);
  if (names.length === 0) {
    return NextResponse.json({
      matches: [],
      message: 'No names found in the CSV. Make sure you\'re using a Goodreads export file.',
    });
  }

  // Search Chapterly users by display_name for each extracted name
  // Use ilike for fuzzy first-name matching
  const matches: Array<{
    goodreads_name: string;
    chapterly_user: { id: string; handle: string; display_name: string; avatar_url: string | null };
  }> = [];

  // Batch: search all names in one query using OR filter
  // Extract first names for better matching
  const firstNames = [...new Set(names.map(n => n.split(' ')[0]).filter(n => n.length > 1))];

  if (firstNames.length > 0) {
    // Build OR filter: display_name ilike '%Name%' for each first name
    const orFilter = firstNames.map(n => `display_name.ilike.%${n}%`).join(',');
    const { data: users } = await supabase
      .from('users')
      .select('id, handle, display_name, avatar_url')
      .or(orFilter)
      .limit(50);

    // Map each Goodreads name to the closest Chapterly user
    for (const grName of names) {
      const grFirst = grName.split(' ')[0].toLowerCase();
      const grLast = grName.split(' ').slice(1).join(' ').toLowerCase();

      const candidate = (users ?? []).find(u => {
        const uName = u.display_name?.toLowerCase() ?? '';
        // Prefer full name match, fall back to first name match
        return uName.includes(grName.toLowerCase()) ||
          (uName.startsWith(grFirst) && (grLast === '' || uName.includes(grLast)));
      });

      if (candidate) {
        matches.push({ goodreads_name: grName, chapterly_user: candidate });
      }
    }
  }

  return NextResponse.json({
    names_found: names.length,
    matches,
  });
}
