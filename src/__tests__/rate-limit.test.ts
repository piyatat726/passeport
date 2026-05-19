/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

function createRequest(path: string, ip = '127.0.0.1'): NextRequest {
  const url = `http://localhost:3000${path}`;
  const req = new NextRequest(url, {
    headers: { 'x-forwarded-for': ip },
  });
  return req;
}

describe('Rate Limiter', () => {
  it('allows requests under the limit', () => {
    const result = rateLimit(createRequest('/api/test', '10.0.0.1'));
    expect(result).toBeNull();
  });

  it('blocks requests over the API limit (30/min)', () => {
    const ip = '10.0.0.2';
    let blocked = false;

    for (let i = 0; i < 35; i++) {
      const result = rateLimit(createRequest('/api/test', ip));
      if (result && result.status === 429) {
        blocked = true;
        break;
      }
    }

    expect(blocked).toBe(true);
  });

  it('blocks auth requests over the limit (10/min)', () => {
    const ip = '10.0.0.3';
    let blocked = false;

    for (let i = 0; i < 15; i++) {
      const result = rateLimit(createRequest('/auth', ip));
      if (result && result.status === 429) {
        blocked = true;
        break;
      }
    }

    expect(blocked).toBe(true);
  });

  it('returns 429 with Retry-After header', () => {
    const ip = '10.0.0.4';

    // Exhaust rate limit
    for (let i = 0; i < 12; i++) {
      rateLimit(createRequest('/auth', ip));
    }

    const result = rateLimit(createRequest('/auth', ip));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
    expect(result!.headers.get('Retry-After')).toBeTruthy();
    expect(result!.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('allows different IPs independently', () => {
    // Exhaust one IP
    for (let i = 0; i < 12; i++) {
      rateLimit(createRequest('/auth', '10.0.0.5'));
    }

    // Different IP should still be allowed
    const result = rateLimit(createRequest('/auth', '10.0.0.6'));
    expect(result).toBeNull();
  });
});
