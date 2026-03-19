export const dynamic = 'force-dynamic';

/**
 * GET /widget/[handle]
 * Returns an SVG badge showing what @handle is currently reading.
 * Embeddable in any website/README: <img src="https://chapterly.app/widget/maxwexley" />
 * Also supports ?theme=dark
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  req: NextRequest,
  { params }: { params: { handle: string } }
) {
  const supabase = createAdminSupabaseClient();
  const theme = req.nextUrl.searchParams.get('theme') ?? 'light';
  const isDark = theme === 'dark';

  const bg = isDark ? '#1a1a1a' : '#fdfcfb';
  const border = isDark ? '#2a2a2a' : '#f0ece4';
  const textPrimary = isDark ? '#f5f5f5' : '#1a1a1a';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const accent = '#ee7a1e';

  // Get user
  const { data: user } = await supabase
    .from('users')
    .select('id, display_name, is_public')
    .eq('handle', params.handle.toLowerCase())
    .maybeSingle();

  if (!user || !user.is_public) {
    return svgResponse(notFoundSvg(bg, border, textPrimary, textSecondary));
  }

  // Get currently reading book
  const { data: reading } = await supabase
    .from('user_books')
    .select('current_page, book:books(title, authors, cover_url, page_count)')
    .eq('user_id', user.id)
    .eq('status', 'reading')
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reading || !reading.book) {
    return svgResponse(nothingSvg(user.display_name, bg, border, textPrimary, textSecondary, accent));
  }

  const book = reading.book as unknown as { title: string; authors: string[]; cover_url?: string | null; page_count?: number | null };
  const progress = book.page_count && reading.current_page
    ? Math.min(100, Math.round((reading.current_page / book.page_count) * 100))
    : null;

  return svgResponse(readingSvg(user.display_name, book, progress, bg, border, textPrimary, textSecondary, accent));
}

function svgResponse(svg: string) {
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    },
  });
}

function readingSvg(
  name: string,
  book: { title: string; authors: string[]; page_count?: number | null },
  progress: number | null,
  bg: string, border: string, text: string, sub: string, accent: string
): string {
  const title = truncate(book.title, 28);
  const author = truncate(book.authors[0] ?? '', 24);
  const progressBar = progress !== null
    ? `<rect x="12" y="62" width="${Math.round(276 * progress / 100)}" height="4" rx="2" fill="${accent}" opacity="0.9"/>
       <text x="300" y="66" font-size="9" fill="${sub}" text-anchor="end">${progress}%</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80" viewBox="0 0 300 80">
  <rect width="300" height="80" rx="12" fill="${bg}" stroke="${border}" stroke-width="1"/>
  <text x="12" y="18" font-family="-apple-system,sans-serif" font-size="9" fill="${sub}" font-weight="500" letter-spacing="0.5">📚 ${truncate(name, 20)} is reading</text>
  <text x="12" y="38" font-family="-apple-system,sans-serif" font-size="13" font-weight="700" fill="${text}">${title}</text>
  <text x="12" y="54" font-family="-apple-system,sans-serif" font-size="10" fill="${sub}">${author}</text>
  ${progress !== null ? `<rect x="12" y="62" width="276" height="4" rx="2" fill="${border}"/>` : ''}
  ${progressBar}
  <text x="288" y="76" font-family="-apple-system,sans-serif" font-size="8" fill="${sub}" text-anchor="end" opacity="0.5">chapterly.app</text>
</svg>`;
}

function nothingSvg(name: string, bg: string, border: string, text: string, sub: string, accent: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60" viewBox="0 0 300 60">
  <rect width="300" height="60" rx="12" fill="${bg}" stroke="${border}" stroke-width="1"/>
  <text x="12" y="24" font-family="-apple-system,sans-serif" font-size="12" font-weight="600" fill="${text}">${truncate(name, 24)}</text>
  <text x="12" y="42" font-family="-apple-system,sans-serif" font-size="10" fill="${sub}">Not reading anything right now</text>
  <text x="288" y="56" font-family="-apple-system,sans-serif" font-size="8" fill="${accent}" text-anchor="end" opacity="0.6">chapterly.app</text>
</svg>`;
}

function notFoundSvg(bg: string, border: string, text: string, sub: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="50" viewBox="0 0 300 50">
  <rect width="300" height="50" rx="12" fill="${bg}" stroke="${border}" stroke-width="1"/>
  <text x="12" y="22" font-family="-apple-system,sans-serif" font-size="11" fill="${text}">Reader not found</text>
  <text x="12" y="38" font-family="-apple-system,sans-serif" font-size="9" fill="${sub}">chapterly.app</text>
</svg>`;
}

function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}
