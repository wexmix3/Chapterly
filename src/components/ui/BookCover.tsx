'use client';
import { useState } from 'react';
import Image from 'next/image';

interface BookCoverProps {
  src?: string | null;
  title: string;
  authors?: string[];
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
}

// Fallback 1: If provided URL fails, try Open Library title search
// Fallback 2: If both fail, show generated placeholder with gradient + initial

export default function BookCover({ src, title, authors, className, width, height, fill, sizes }: BookCoverProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(src ?? null);
  const [failed, setFailed] = useState(false);

  const googleFallback = `https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-M.jpg`;

  const handleError = () => {
    if (imgSrc && imgSrc !== googleFallback) {
      setImgSrc(googleFallback);
    } else {
      setFailed(true);
    }
  };

  // Deterministic color from title (cycles through 5 brand-adjacent colors)
  const colors: [string, string][] = [
    ['#fad7ad', '#ee7a1e'],  // brand light/dark
    ['#e9dfce', '#b94912'],  // paper/brand-700
    ['#f6b978', '#df6113'],  // brand-300/brand-600
    ['#fdfcfb', '#933b16'],  // paper-50/brand-800
    ['#fdedd6', '#773315'],  // brand-100/brand-900
  ];
  const colorIdx = title.charCodeAt(0) % colors.length;
  const [bgColor, textColor] = colors[colorIdx];
  const initial = title.charAt(0).toUpperCase();
  const authorLine = authors?.[0]?.split(' ').pop() ?? '';

  if (failed || !imgSrc) {
    const placeholderStyle: React.CSSProperties = {
      background: `linear-gradient(135deg, ${bgColor}, ${bgColor}cc)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: textColor,
    };
    if (fill) {
      return (
        <div className={`absolute inset-0 ${className ?? ''}`} style={placeholderStyle}>
          <span style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{initial}</span>
          {authorLine && <span style={{ fontSize: '0.55rem', marginTop: 4, opacity: 0.7, textAlign: 'center', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>{authorLine}</span>}
        </div>
      );
    }
    return (
      <div className={className ?? ''} style={{ ...placeholderStyle, width, height }}>
        <span style={{ fontSize: Math.min((width ?? 48) * 0.4, 32), fontWeight: 700, lineHeight: 1 }}>{initial}</span>
        {authorLine && <span style={{ fontSize: 9, marginTop: 2, opacity: 0.7, textAlign: 'center', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>{authorLine}</span>}
      </div>
    );
  }

  const commonProps = {
    src: imgSrc,
    alt: title,
    onError: handleError,
    className,
    unoptimized: true,
  };

  if (fill) return <Image {...commonProps} fill sizes={sizes ?? '(max-width: 768px) 100vw, 200px'} alt={title} />;
  return <Image {...commonProps} width={width ?? 48} height={height ?? 72} alt={title} />;
}
