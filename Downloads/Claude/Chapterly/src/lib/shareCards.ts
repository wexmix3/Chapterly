export type CardThemeName = 'warm' | 'midnight' | 'forest' | 'cream';

export interface CardTheme {
  bg: string;
  bgGradient: string;
  accent: string;
  text: string;
  textSecondary: string;
  badge: string;
}

export const CARD_THEMES: Record<CardThemeName, CardTheme> = {
  warm: {
    bg: '#fdedd6',
    bgGradient: 'linear-gradient(145deg, #fef7ee 0%, #fad7ad 100%)',
    accent: '#ee7a1e',
    text: '#401709',
    textSecondary: '#933b16',
    badge: '#b94912',
  },
  midnight: {
    bg: '#1a1a2e',
    bgGradient: 'linear-gradient(145deg, #16213e 0%, #0f3460 100%)',
    accent: '#e94560',
    text: '#eaeaea',
    textSecondary: '#a8a8c0',
    badge: '#e94560',
  },
  forest: {
    bg: '#1a2e1a',
    bgGradient: 'linear-gradient(145deg, #1a2e1a 0%, #2d4a2d 100%)',
    accent: '#7bc67e',
    text: '#e8f5e9',
    textSecondary: '#a5d6a7',
    badge: '#7bc67e',
  },
  cream: {
    bg: '#fdfcfb',
    bgGradient: 'linear-gradient(145deg, #fdfcfb 0%, #f3ede2 100%)',
    accent: '#5d5d5d',
    text: '#1a1a1a',
    textSecondary: '#6d6d6d',
    badge: '#454545',
  },
};

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatPages(pages: number): string {
  if (pages >= 1000) return `${(pages / 1000).toFixed(1)}k`;
  return pages.toString();
}
