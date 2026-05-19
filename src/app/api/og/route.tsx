import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'PASSEPORT';
  const subtitle = searchParams.get('subtitle') || '';
  const author = searchParams.get('author') || '';
  const category = searchParams.get('category') || '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: '#F7F4EF',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {/* Left content area — 60% */}
        <div
          style={{
            width: '60%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '56px 52px 44px 56px',
          }}
        >
          {/* Top: Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            <span
              style={{
                fontSize: '18px',
                fontStyle: 'italic',
                color: '#222222',
                letterSpacing: '6px',
                fontFamily: 'Georgia, serif',
              }}
            >
              PASSEPORT
            </span>
            <div
              style={{
                width: '40px',
                height: '1.5px',
                backgroundColor: '#B8A898',
                marginTop: '12px',
              }}
            />
          </div>

          {/* Middle: Title + Subtitle */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginTop: '-20px',
            }}
          >
            {category && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#B8A898',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  fontFamily: 'Helvetica, Arial, sans-serif',
                }}
              >
                {category}
              </span>
            )}
            <h1
              style={{
                fontSize: title.length > 30 ? '36px' : '44px',
                fontWeight: 700,
                fontStyle: 'italic',
                color: '#222222',
                lineHeight: 1.2,
                margin: '0',
                fontFamily: 'Georgia, serif',
                maxWidth: '580px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontSize: '16px',
                  color: '#B8A898',
                  lineHeight: 1.5,
                  margin: '0',
                  fontStyle: 'italic',
                  fontFamily: 'Georgia, serif',
                  maxWidth: '520px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Bottom: Author + domain */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '0.5px',
                backgroundColor: '#D6CFC6',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {author && (
                <span
                  style={{
                    fontSize: '12px',
                    color: '#B8A898',
                    letterSpacing: '1px',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                  }}
                >
                  by {author}
                </span>
              )}
              <span
                style={{
                  fontSize: '10px',
                  color: '#C8C0B6',
                  letterSpacing: '1.5px',
                  fontFamily: 'Helvetica, Arial, sans-serif',
                }}
              >
                passeport-gamma.vercel.app
              </span>
            </div>
          </div>
        </div>

        {/* Right decorative area — 40% */}
        <div
          style={{
            width: '40%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Gradient background */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'linear-gradient(135deg, #D6CFC6 0%, #B8A898 40%, #A89888 100%)',
            }}
          />

          {/* Decorative diagonal lines */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 0.15,
            }}
          >
            {/* Repeating thin lines for texture */}
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '140%',
                  height: '1px',
                  backgroundColor: '#FFFFFF',
                  marginBottom: '24px',
                  transform: 'rotate(-45deg)',
                }}
              />
            ))}
          </div>

          {/* Centered PASSEPORT watermark */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.25)',
                letterSpacing: '8px',
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif',
                transform: 'rotate(-90deg)',
              }}
            >
              PASSEPORT
            </span>
          </div>

          {/* Top-right subtle accent */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              right: '40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '6px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '1px',
                backgroundColor: 'rgba(255,255,255,0.4)',
              }}
            />
            <div
              style={{
                width: '20px',
                height: '1px',
                backgroundColor: 'rgba(255,255,255,0.3)',
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
