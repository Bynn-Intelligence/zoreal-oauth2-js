// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resumeLogin, startLogin } from '../src/login';
import { markReturnDone } from '../src/return';
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
    const realLocation = Object.getOwnPropertyDescriptor(window, 'location')!;
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://rp.example', href: 'https://rp.example/login?next=%2Fapp#top', assign },
      writable: true,
      configurable: true,
    });
    localStorage.clear();

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
    // The way back is this page, without its fragment, and the flow it will
    // need is saved under the pairing it named.
    expect(q.get('return_to')).toBe('https://rp.example/login?next=%2Fapp');
    const saved = JSON.parse(localStorage.getItem(`zoreal:oauth2:return:${q.get('request_id')}`)!);
    expect(saved.flow).toBe('browser-direct');
    expect(saved.state).toBe(q.get('state'));
    expect(saved.nonce).toBe(q.get('nonce'));
    expect(saved.verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
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
    // Finished here, so a returned page that comes later would stand down.
    expect(localStorage.getItem(`zoreal:oauth2:done:${requestId}`)).not.toBeNull();
    expect(localStorage.getItem(`zoreal:oauth2:return:${requestId}`)).toBeNull();
    Object.defineProperty(window, 'location', realLocation);
  });

  it('stands down when the page the app reopened has already finished the sign-in', async () => {
    useFakePollTimers();
    const realLocation = Object.getOwnPropertyDescriptor(window, 'location')!;
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://rp.example', href: 'https://rp.example/login', assign: vi.fn() },
      writable: true,
      configurable: true,
    });
    localStorage.clear();
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (String(url).includes('/status')) return Promise.resolve(json({ status: 'approved', code: 'code-1' }));
      throw new Error(`unexpected fetch: ${url}`);
    });
    const handle = startLogin({ clientId: 'ast_x', issuer: 'https://id.zoreal.test', display: 'link' });
    markReturnDone(handle.requestId!);
    await flush();
    await vi.advanceTimersByTimeAsync(2100);
    await flush();
    await expect(handle.promise).rejects.toMatchObject({ name: 'AbortError' });
    Object.defineProperty(window, 'location', realLocation);
  });

  it('resumes on the page the app reopened, from the saved flow, and clears the fragment', async () => {
    localStorage.clear();
    const id = 'R'.repeat(32);
    localStorage.setItem(
      `zoreal:oauth2:return:${id}`,
      JSON.stringify({
        v: 1,
        issuer: 'https://id.zoreal.test',
        clientId: 'ast_x',
        flow: 'auth-code',
        verifier: 'v'.repeat(43),
        nonce: 'nonce-1',
        state: 'state-1',
        scope: 'openid email',
        appState: 'app-1',
        requestId: id,
        createdAt: Date.now(),
      })
    );
    window.location.hash = `#zoreal_return=${id}`;
    const statuses: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/status')) {
        statuses.push(u);
        return Promise.resolve(json({ status: 'approved', code: 'code-9' }));
      }
      throw new Error(`unexpected fetch: ${u}`);
    });

    // Not a return for another client, which leaves the flow for its owner.
    expect(resumeLogin({ clientId: 'ast_other' })).toBeNull();
    // The fragment is gone from the address bar as soon as it has been read.
    expect(window.location.hash).toBe('');
    const handle = resumeLogin({ clientId: 'ast_x' });
    expect(handle).not.toBeNull();
    const result = (await handle!.promise) as { code: string; code_verifier: string; nonce: string; app_state?: string };
    expect(result.code).toBe('code-9');
    expect(result.code_verifier).toBe('v'.repeat(43));
    expect(result.nonce).toBe('nonce-1');
    expect(result.app_state).toBe('app-1');
    expect(statuses[0]).toBe(`https://id.zoreal.test/pair/${id}/status`);
    expect(localStorage.getItem(`zoreal:oauth2:done:${id}`)).not.toBeNull();
    // A second page load with nothing in the fragment is not a return.
    expect(resumeLogin({ clientId: 'ast_x' })).toBeNull();
  });
});
