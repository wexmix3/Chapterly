import type { GoodreadsCSVRow, BookSearchResult, ShelfStatus } from '@/types';

// Alias for backward compatibility
export { parseLibraryCSV as parseGoodreadsCSV, convertLibraryRow as convertGoodreadsRow };

export function parseLibraryCSV(csvText: string): GoodreadsCSVRow[] {
  const lines = csvText.split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: GoodreadsCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    rows.push(row as unknown as GoodreadsCSVRow);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function mapShelfStatus(exclusiveShelf: string): ShelfStatus {
  const map: Record<string, ShelfStatus> = {
    read: 'read',
    'currently-reading': 'reading',
    'to-read': 'to_read',
    'did-not-finish': 'dnf',
  };
  return map[exclusiveShelf.toLowerCase()] ?? 'to_read';
}

export function convertLibraryRow(row: GoodreadsCSVRow): {
  searchResult: BookSearchResult;
  status: ShelfStatus;
  rating: number | null;
  review: string | null;
} {
  const cleanISBN = (s: string) => s.replace(/[="]/g, '').trim();
  const isbn13 = cleanISBN(row['ISBN13']);
  const isbn10 = cleanISBN(row['ISBN']);
  const pageCount = parseInt(row['Number of Pages'], 10) || null;
  const publishedYear = parseInt(row['Original Publication Year'] || row['Year Published'], 10) || null;
  const ratingRaw = parseInt(row['My Rating'], 10);
  const rating = ratingRaw > 0 ? ratingRaw : null;

  const coverId = isbn13 || isbn10;
  const coverUrl = coverId
    ? `https://covers.openlibrary.org/b/isbn/${coverId}-L.jpg`
    : null;

  const searchResult: BookSearchResult = {
    source: 'openlibrary',
    source_id: `goodreads-${row['Book Id']}`,
    title: row['Title'],
    authors: [row['Author']].filter(Boolean),
    cover_url: coverUrl,
    published_year: publishedYear,
    isbn13: isbn13 || null,
    isbn10: isbn10 || null,
    page_count: pageCount,
  };

  return {
    searchResult,
    status: mapShelfStatus(row['Exclusive Shelf']),
    rating,
    review: row['My Review'] || null,
  };
}
