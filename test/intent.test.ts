import { describe, expect, it } from 'vitest';
import { strings } from '../src/i18n';
import { resolveIntent, titleFor } from '../src/intent';

describe('resolveIntent', () => {
  it('is a sign-in for the identifier, the email and the name', () => {
    expect(resolveIntent(undefined, undefined, undefined)).toBe('sign-in');
    expect(resolveIntent(undefined, 'openid', undefined)).toBe('sign-in');
    expect(resolveIntent(undefined, 'openid email profile.name', undefined)).toBe('sign-in');
    expect(resolveIntent(undefined, 'openid email', 'zoreal.live')).toBe('sign-in');
  });

  it('is an identification once a document attribute is requested', () => {
    expect(resolveIntent(undefined, 'openid zoreal.age', undefined)).toBe('identify');
    expect(resolveIntent(undefined, 'openid profile.birthdate', undefined)).toBe('identify');
    expect(resolveIntent(undefined, 'openid email profile.document', ['zoreal.live'])).toBe('identify');
  });

  it('is a presence check for the identifier alone with a liveness capture', () => {
    expect(resolveIntent(undefined, 'openid', 'zoreal.live')).toBe('presence');
    expect(resolveIntent(undefined, 'openid', ['zoreal.live', 'zoreal.device'])).toBe('presence');
    expect(resolveIntent(undefined, 'openid', 'zoreal.device')).toBe('sign-in');
  });

  it('lets an explicit intent win', () => {
    expect(resolveIntent('identify', 'openid', undefined)).toBe('identify');
    expect(resolveIntent('sign-in', 'openid profile.portrait', 'zoreal.live')).toBe('sign-in');
  });
});

describe('titleFor', () => {
  it('picks a distinct title per intent in every locale', () => {
    for (const locale of ['en', 'sv', 'ja', 'ar', 'pt-BR', 'zh-Hans']) {
      const t = strings(locale);
      const titles = ['sign-in', 'identify', 'presence'].map((i) => titleFor(t, i as never));
      expect(new Set(titles).size).toBe(3);
      expect(titles[0]).toBe(t.title);
    }
  });
});
