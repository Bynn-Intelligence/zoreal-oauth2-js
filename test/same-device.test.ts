// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startLogin } from '../src/login';
import type { PairingState } from '../src/types';

/**
 * The same-device sign-in is a navigation inside the tap, not a fetch
 * followed by a redirect: the page navigates to the provider's start endpoint
 * with everything a pairing needs, names the pairing it will poll, and keeps
 * polling while the provider is still answering that navigation.
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const useFakePollTimers = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
const flush = async () => {
  for (let i = 0; i < 50; i++) await new Promise((resolve) => setImmediate(resolve));
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('same device', () => {
  it('navigates to /pair/start inside the tap, fetches nothing first, and polls the token it chose', async () => {
    useFakePollTimers();
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://rp.example', assign },
      writable: true,
      configurable: true,
    });

    const statusCalls: string[] = [];
    let polls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/status')) {
        statusCalls.push(u);
        polls += 1;
        // The navigation kills the first request, then the pairing is not there yet.
        if (polls === 1) return Promise.reject(new TypeError('Load failed'));
        if (polls === 2) return Promise.resolve(json({ error: 'invalid_request', error_description: 'unknown pairing request' }, 404));
        if (polls === 3) return Promise.resolve(json({ status: 'pending', expires_in: 118 }));
        return Promise.resolve(json({ status: 'approved', code: 'code-1' }));
      }
      if (u.endsWith('/token')) {
        return Promise.resolve(json({ id_token: 'a.b.c' }));
      }
      throw new Error(`unexpected fetch: ${u}`);
    });

    const states: PairingState[] = [];
    const handle = startLogin({
      clientId: 'ast_x',
      issuer: 'https://id.zoreal.test',
      display: 'link',
      scope: 'openid email',
      onState: (s) => states.push(s),
    });

    // The navigation happened synchronously, before any await.
    expect(assign).toHaveBeenCalledTimes(1);
    const url = new URL(assign.mock.calls[0][0] as string);
    expect(`${url.origin}${url.pathname}`).toBe('https://id.zoreal.test/pair/start');
    const q = url.searchParams;
    expect(q.get('client_id')).toBe('ast_x');
    expect(q.get('scope')).toBe('openid email');
    expect(q.get('origin')).toBe('https://rp.example');
    expect(q.get('code_challenge_method')).toBe('S256');
    expect(q.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(q.get('state')).toBeTruthy();
    expect(q.get('nonce')).toBeTruthy();
    expect(q.get('request_id')).toMatch(/^[A-Za-z0-9]{32}$/);
    expect(q.get('display')).toBeNull();
    expect(handle.appLink).toBe(true);
    expect(handle.pairUrl).toBe(url.toString());
    // No dialog for a phone.
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    const requestId = q.get('request_id')!;
    // Nothing is fetched until the navigation has had a moment to begin.
    await flush();
    expect(statusCalls.length).toBe(0);
    for (let i = 0; i < 4; i++) {
      await vi.advanceTimersByTimeAsync(2100);
      await flush();
    }
    const result = await handle.promise;

    expect(result.select_by).toBe('app_link');
    expect(statusCalls.length).toBeGreaterThanOrEqual(4);
    for (const call of statusCalls) expect(call).toBe(`https://id.zoreal.test/pair/${requestId}/status`);
    // The killed request and the "no such pairing" were read as pending, not as failure.
    expect(states[0].status).toBe('pending');
    expect(states.every((s) => s.appLink === true && s.pairUrl === url.toString())).toBe(true);
  });
});
