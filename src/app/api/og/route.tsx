export const dynamic = 'force-dynamic';

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Dynamic OG image generator.
 *
 * Usage:
 *   Profile:  /api/og?type=profile&name=Alex&handle=alex&books=24
 *   Book:     /api/og?type=book&title=Dune&author=Frank+Herbert&cover=<url>
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'default';

  try {
    if (type === 'profile') {
      const name = searchParams.get('name') ?? 'Reader';
      const handle = searchParams.get('handle') ?? '';
      const books = searchParams.get('books') ?? '0';
      const avatar = searchParams.get('avatar') ?? '';
      // Single emoji avatars stored as avatar_url
      const isEmoji = avatar.length <= 2 && /\p{Emoji}/u.test(avatar);

      return new ImageResponse(
        (
          <div
            style={{
              width: '1200px',
              height: '630px',
              background: 'linear-gradient(135deg, #fdfcfb 0%, #fff7ed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Georgia, serif',
            }}
          >
            {/* Background pattern */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at 70% 50%, #fed7aa44 0%, transparent 60%)',
              }}
            />

            {/* Card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                padding: '60px',
                background: 'white',
                borderRadius: '32px',
                boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
                minWidth: '500px',
                border: '1px solid #f0ece4',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fad7ad, #ee7a1e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isEmoji ? '52px' : '42px',
                  fontWeight: 700,
                  color: isEmoji ? undefined : 'white',
                  overflow: 'hidden',
                }}
              >
                {isEmoji ? avatar : !avatar ? name.charAt(0).toUpperCase() : undefined}
                {avatar && !isEmoji && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>

              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '42px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.1 }}>{name}</div>
                {handle && <div style={{ fontSize: '22px', color: '#9ca3af' }}>@{handle}</div>}
              </div>

              {/* Stat chip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '99px',
                  padding: '10px 24px',
                }}
              >
                <span style={{ fontSize: '24px' }}>📚</span>
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#ee7a1e' }}>{books} books read</span>
              </div>
            </div>

            {/* Chapterly brand */}
            <div
              style={{
                position: 'absolute',
                bottom: '36px',
                right: '48px',
                fontSize: '22px',
                fontWeight: 800,
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              📚 Chapterly
            </div>
          </div>
        ),
        { width: 1200, height: 630 },
      );
    }

    if (type === 'book') {
      const title = searchParams.get('title') ?? 'Unknown Book';
      const author = searchParams.get('author') ?? '';
      const cover = searchParams.get('cover') ?? '';
      const rating = searchParams.get('rating') ?? '';
      const ratingCount = searchParams.get('ratingCount') ?? '';

      const stars = rating ? Math.round(parseFloat(rating)) : 0;
      const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);

      return new ImageResponse(
        (
          <div
            style={{
              width: '1200px',
              height: '630px',
              background: 'linear-gradient(135deg, #fdfcfb 0%, #fef3c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '64px',
              padding: '60px',
              fontFamily: 'Georgia, serif',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, #fed7aa33 0%, transparent 60%)' }} />

            {/* Book cover */}
            {cover ? (
              <div
                style={{
                  width: '200px',
                  height: '300px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div
                style={{
                  width: '200px',
                  height: '300px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #fad7ad, #ee7a1e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px',
                  flexShrink: 0,
                }}
              >
                📚
              </div>
            )}

            {/* Book info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div style={{ fontSize: '46px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.15 }}>
                {title.length > 40 ? title.slice(0, 40) + '…' : title}
              </div>
              {author && (
                <div style={{ fontSize: '28px', color: '#6b7280' }}>by {author}</div>
              )}
              {rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px', color: '#f59e0b', letterSpacing: '2px' }}>{starStr}</span>
                  <span style={{ fontSize: '22px', color: '#9ca3af' }}>
                    {parseFloat(rating).toFixed(1)}{ratingCount ? ` · ${ratingCount} readers` : ''}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '99px',
                  padding: '10px 20px',
                  width: 'fit-content',
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#ee7a1e' }}>Track on Chapterly</span>
              </div>
            </div>

            {/* Brand */}
            <div
              style={{
                position: 'absolute',
                bottom: '36px',
                right: '48px',
                fontSize: '22px',
                fontWeight: 800,
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              📚 Chapterly
            </div>
          </div>
        ),
        { width: 1200, height: 630 },
      );
    }

    // Default fallback
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Georgia, serif',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '80px' }}>📚</div>
            <div style={{ fontSize: '54px', fontWeight: 800, color: '#1a1a1a' }}>Chapterly</div>
            <div style={{ fontSize: '26px', color: '#6b7280' }}>Track your reading journey</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  } catch {
    return new Response('OG image generation failed', { status: 500 });
  }
}
