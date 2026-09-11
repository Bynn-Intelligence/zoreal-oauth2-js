import { describe, expect, it } from 'vitest';
import { challengeS256, challengeS256Sync, generateRequestId, generateState, generateVerifier } from '../src/pkce';

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

  it('digests synchronously to the same challenge as WebCrypto', async () => {
    expect(challengeS256Sync('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
    );
    for (let i = 0; i < 50; i++) {
      const v = generateVerifier() + 'x'.repeat(i * 3);
      expect(challengeS256Sync(v)).toBe(await challengeS256(v));
    }
    // Block boundaries: 55, 56, 64 and 119 bytes are where padding turns over.
    for (const n of [0, 1, 55, 56, 63, 64, 65, 119, 120, 200]) {
      const v = 'a'.repeat(n);
      expect(challengeS256Sync(v)).toBe(await challengeS256(v));
    }
  });

  it('names a pairing with 32 letters or digits and never repeats', () => {
    const seen = new Set(Array.from({ length: 200 }, generateRequestId));
    expect(seen.size).toBe(200);
    for (const id of seen) expect(id).toMatch(/^[A-Za-z0-9]{32}$/);
  });

  it('never repeats state', () => {
    const seen = new Set(Array.from({ length: 100 }, generateState));
    expect(seen.size).toBe(100);
  });
});
