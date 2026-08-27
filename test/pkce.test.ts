import { describe, expect, it } from 'vitest';
import { challengeS256, generateState, generateVerifier } from '../src/pkce';

describe('pkce', () => {
  it('produces the RFC 7636 appendix B challenge for the known verifier', async () => {
    expect(await challengeS256('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
    );
  });

  it('generates verifiers of RFC-valid length and charset', () => {
    for (let i = 0; i < 20; i++) {
      const v = generateVerifier();
      expect(v.length).toBeGreaterThanOrEqual(43);
      expect(v.length).toBeLessThanOrEqual(128);
      expect(v).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it('never repeats state', () => {
    const seen = new Set(Array.from({ length: 100 }, generateState));
    expect(seen.size).toBe(100);
  });
});
