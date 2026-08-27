import { afterEach, describe, expect, it, vi } from 'vitest';
import { interpolate, isRtl, strings } from '../src/i18n';

const ALL_LOCALES = [
  'en', 'sv', 'es', 'es-419', 'pt', 'pt-BR', 'fr', 'de', 'ru', 'ja', 'hi', 'zh-Hans', 'zh-Hant',
  'ar', 'ko', 'bg', 'bn', 'bs', 'cs', 'da', 'el', 'fi', 'he', 'hr', 'hu', 'id', 'it', 'ms',
  'nl', 'no', 'pl', 'ro', 'sr', 'th', 'tl', 'tr', 'uk', 'ur', 'vi',
];

describe('strings', () => {
  it('resolves an exact locale', () => {
    expect(strings('sv').title).toBe('Skanna för att logga in');
  });

  it('resolves a regional tag to its primary language', () => {
    expect(strings('pt-BR').cancel).toBe(strings('pt').cancel);
    expect(strings('de-AT').cancel).toBe(strings('de').cancel);
  });

  it('is case and separator insensitive', () => {
    expect(strings('FR_CA').cancel).toBe(strings('fr').cancel);
  });

  // The one split that needs more than the primary subtag, and the one most
  // likely to regress: a Simplified reader must never be served Traditional.
  it('splits Chinese by script, not by primary subtag', () => {
    expect(strings('zh-Hans').cancel).toBe('取消');
    expect(strings('zh-CN').close).toBe('关闭');
    expect(strings('zh-Hant').close).toBe('關閉');
    expect(strings('zh-TW').close).toBe('關閉');
    expect(strings('zh').close).toBe('關閉');
  });

  it('falls back to English rather than rendering a key', () => {
    expect(strings('xx').title).toBe(strings('en').title);
    expect(strings(undefined).title).toBe(strings('en').title);
  });

  it('carries every key in every locale', () => {
    const keys = Object.keys(strings('en')).sort();
    for (const locale of ALL_LOCALES) {
      const got = strings(locale);
      expect(Object.keys(got).sort(), `${locale} key set`).toEqual(keys);
      for (const [key, value] of Object.entries(got)) {
        expect(value, `${locale}.${key}`).toBeTruthy();
      }
    }
  });

  // The countdown is the only interpolated string; losing the placeholder in a
  // translation would silently ship a timer with no number in it.
  it('keeps the {time} placeholder in every locale', () => {
    for (const locale of ALL_LOCALES) {
      expect(strings(locale).expiresIn, locale).toContain('{time}');
    }
  });
});

describe('isRtl', () => {
  it('flags Arabic and not the others', () => {
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('ar-EG')).toBe(true);
    expect(isRtl('en')).toBe(false);
    expect(isRtl(undefined)).toBe(false);
  });
});

describe('interpolate', () => {
  it('substitutes the time', () => {
    expect(interpolate('Expires in {time}', '1:59')).toBe('Expires in 1:59');
  });
});

/**
 * With no locale from the host, the modal follows the browser. This is the
 * default path for any integrator who never sets `locale`, so it is the one
 * most people will actually ship.
 */
describe('browser preference', () => {
  const setLanguages = (languages: string[]) => {
    vi.stubGlobal('navigator', { languages, language: languages[0] });
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the browser language when none is passed', () => {
    setLanguages(['sv-SE', 'en-US']);
    expect(strings().title).toBe(strings('sv').title);
  });

  it('walks the preference list past languages it does not carry', () => {
    setLanguages(['cy-GB', 'is-IS', 'de-DE']);
    expect(strings().title).toBe(strings('de').title);
  });

  it('falls back to English when it carries none of them', () => {
    setLanguages(['cy-GB', 'is-IS']);
    expect(strings().title).toBe(strings('en').title);
  });

  it('lets an explicit locale win over the browser', () => {
    setLanguages(['sv-SE']);
    expect(strings('ja').title).toBe(strings('ja').title);
    expect(strings('ja').title).not.toBe(strings('sv').title);
  });

  it('reads direction from the browser too', () => {
    setLanguages(['ar-EG']);
    expect(isRtl()).toBe(true);
    setLanguages(['en-US']);
    expect(isRtl()).toBe(false);
  });

  it('survives a navigator with only `language`', () => {
    vi.stubGlobal('navigator', { language: 'ko-KR' });
    expect(strings().title).toBe(strings('ko').title);
  });
});

/**
 * Brand terms are load-bearing: the modal is asking someone to approve a login
 * in a named app, and a translated or transliterated product name is a person
 * looking for an app that does not exist.
 */
describe('brand terms survive translation', () => {
  it('keeps ZOREAL and Proof-of-Human in Latin script everywhere', () => {
    for (const locale of ALL_LOCALES) {
      const s = strings(locale);
      for (const key of ['bodyScan', 'bodyApprove', 'bodyEnrolling', 'noIdTitle', 'qrAlt'] as const) {
        expect(s[key], `${locale}.${key}`).toContain('ZOREAL');
      }
      expect(s.secured, `${locale}.secured`).toContain('Proof-of-Human');
    }
  });

  // A stray RLM/LRM would fight the container's own dir and scramble the line.
  it('carries no bidi control characters', () => {
    const bidi = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/;
    for (const locale of ALL_LOCALES) {
      for (const [key, value] of Object.entries(strings(locale))) {
        expect(bidi.test(value), `${locale}.${key}`).toBe(false);
      }
    }
  });
});

describe('regional variants', () => {
  // Spain and Latin America are separate entries; resolving es-MX to peninsular
  // Spanish is the near-miss that reads as nobody having thought about it.
  it('routes Latin American Spanish away from peninsular Spanish', () => {
    // Compared on bodyScan, not title: "Scan to sign in" is genuinely the same
    // sentence in both variants, and the split shows up in vocabulary
    // (celular vs telefono) rather than in every string.
    for (const tag of ['es-419', 'es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-PE']) {
      expect(strings(tag).bodyScan, tag).toBe(strings('es-419').bodyScan);
      expect(strings(tag).bodyScan, tag).not.toBe(strings('es').bodyScan);
    }
  });

  it('actually carries different text for the two Spanish variants', () => {
    const es = strings('es');
    const latam = strings('es-419');
    const differing = Object.keys(es).filter((k) => es[k as keyof typeof es] !== latam[k as keyof typeof latam]);
    expect(differing.length).toBeGreaterThan(0);
  });

  it('keeps Spain on peninsular Spanish', () => {
    expect(strings('es-ES').bodyScan).toBe(strings('es').bodyScan);
  });

  it('routes Brazilian Portuguese away from European Portuguese', () => {
    expect(strings('pt-BR').bodyScan).toBe(strings('pt-br').bodyScan);
    expect(strings('pt-BR').bodyScan).not.toBe(strings('pt').bodyScan);
    expect(strings('pt-PT').bodyScan).toBe(strings('pt').bodyScan);
  });
});

describe('aliases', () => {
  it('maps Norwegian written standards onto the one we ship', () => {
    expect(strings('nb-NO').title).toBe(strings('no').title);
    expect(strings('nn').title).toBe(strings('no').title);
  });

  it('maps Filipino onto Tagalog', () => {
    expect(strings('fil-PH').title).toBe(strings('tl').title);
  });

  // Some platforms still emit the pre-1989 codes.
  it('honours superseded ISO codes', () => {
    expect(strings('iw').title).toBe(strings('he').title);
    expect(strings('in').title).toBe(strings('id').title);
    expect(isRtl('iw')).toBe(true);
  });
});

describe('direction', () => {
  it('flags every RTL language we carry', () => {
    for (const tag of ['ar', 'ar-EG', 'he', 'he-IL', 'ur', 'ur-PK']) {
      expect(isRtl(tag), tag).toBe(true);
    }
  });

  // The dialog must not flip for a language that falls back to English.
  it('does not flag an RTL language we do not translate', () => {
    expect(isRtl('fa')).toBe(false);
    expect(strings('fa').title).toBe(strings('en').title);
  });

  it('leaves every LTR language alone', () => {
    for (const tag of ['en', 'sv', 'th', 'bn', 'uk', 'sr', 'vi']) {
      expect(isRtl(tag), tag).toBe(false);
    }
  });
});
