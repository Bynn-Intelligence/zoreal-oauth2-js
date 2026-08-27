import { afterEach, describe, expect, it, vi } from 'vitest';
import { startLogin } from '../src/login';
import { FlowAbandonedError, OAuthFlowError } from '../src/pairing';
import { challengeS256 } from '../src/pkce';
import type { PairingState } from '../src/types';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const b64url = (s: string) =>
  Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const idToken = (claims: Record<string, unknown>) =>
  `${b64url('{"alg":"ES256"}')}.${b64url(JSON.stringify(claims))}.sig`;

/** Routes the stubbed fetch by endpoint; status responses are consumed in order. */
function stubProvider(input: {
  pair?: Response | (() => Response);
  statuses?: Array<Record<string, unknown>>;
  token?: Record<string, unknown>;
}) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const statuses = [...(input.statuses ?? [])];
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url, init) => {
    calls.push({ url: String(url), init: init as RequestInit });
    // The real fetch refuses an already-aborted signal; the stub must too.
    if ((init as RequestInit | undefined)?.signal?.aborted) {
      return Promise.reject(new DOMException('aborted', 'AbortError'));
    }
    const u = String(url);
    if (u.endsWith('/pair')) {
      const pair = input.pair ?? json({ request_id: 'r1', pair_url: 'https://zoreal.com/qr/r1', expires_in: 120 });
      return Promise.resolve(typeof pair === 'function' ? pair() : pair.clone());
    }
    if (u.includes('/status')) {
      const next = statuses.length > 1 ? statuses.shift() : statuses[0];
      return Promise.resolve(json(next ?? { status: 'pending' }));
    }
    if (u.endsWith('/token')) {
      return Promise.resolve(json(input.token ?? { id_token: idToken({ acr: 'zoreal.live' }) }));
    }
    throw new Error(`unexpected fetch: ${u}`);
  });
  return { calls, fetchMock };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/**
 * Fake only the timers the poll cadence uses, so crypto.subtle and the
 * stubbed fetch still resolve on the real event loop.
 */
const useFakePollTimers = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

/** Lets the non-timer async work (PKCE digest, stubbed fetch) settle. */
const flush = async () => {
  for (let i = 0; i < 25; i++) await new Promise((resolve) => setImmediate(resolve));
};

describe('startLogin, browser-direct', () => {
  it('pairs, polls, exchanges, and resolves with the credential', async () => {
    useFakePollTimers();
    const { calls } = stubProvider({
      statuses: [{ status: 'pending', expires_in: 118 }, { status: 'approved', code: 'code-1' }],
    });

    const states: PairingState[] = [];
    const handle = startLogin({
      clientId: 'ast_x',
      issuer: 'https://id.zoreal.test',
      onState: (s) => states.push(s),
    });

    await flush(); // pair created, first poll answered pending
    await vi.advanceTimersByTimeAsync(2000); // the cadence to the approving poll
    await flush();
    const result = await handle.promise;

    expect(result.credential).toBe(idToken({ acr: 'zoreal.live' }));
    expect(result.clientId).toBe('ast_x');
    expect(result.select_by).toBe('qr');
    expect(result.acr).toBe('zoreal.live');

    // The synthetic initial state, then the polled ones.
    expect(states.map((s) => s.status)).toEqual(['pending', 'pending', 'approved']);
    // Every state carries the render surface and the cancel control.
    for (const s of states) {
      expect(s.pairUrl).toBe('https://zoreal.com/qr/r1');
      expect(s.qrUrl).toBe('https://id.zoreal.test/pair/r1/qr.svg');
      expect(s.appLink).toBe(false);
      expect(typeof s.cancel).toBe('function');
    }

    // The handle fills in once the pairing exists.
    expect(handle.requestId).toBe('r1');
    expect(handle.pairUrl).toBe('https://zoreal.com/qr/r1');
    expect(handle.qrUrl).toBe('https://id.zoreal.test/pair/r1/qr.svg');
    expect(handle.appLink).toBe(false);

    // The exchange carried PKCE and client_id, never a secret.
    const tokenCall = calls.find((c) => c.url.endsWith('/token'))!;
    const body = tokenCall.init!.body as URLSearchParams;
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('code-1');
    expect(body.get('client_id')).toBe('ast_x');
    expect(body.get('client_secret')).toBeNull();
  });

  it('resolves a prompt=none immediate code as select_by session, no polling', async () => {
    const { calls } = stubProvider({ pair: json({ code: 'code-silent' }) });

    const result = await startLogin({
      clientId: 'ast_x',
      issuer: 'https://id.zoreal.test',
      prompt: 'none',
    }).promise;

    expect(result.select_by).toBe('session');
    expect(calls.some((c) => c.url.includes('/status'))).toBe(false);
  });

  it("rejects with the provider's refusal verbatim as OAuthFlowError", async () => {
    stubProvider({
      pair: json({ error: 'invalid_scope', error_description: 'profile.name needs a confidential client' }, 400),
    });

    const handle = startLogin({ clientId: 'ast_x', issuer: 'https://id.zoreal.test' });
    await expect(handle.promise).rejects.toBeInstanceOf(OAuthFlowError);
    await expect(handle.promise).rejects.toMatchObject({
      error: 'invalid_scope',
      description: 'profile.name needs a confidential client',
    });
  });

  it('rejects a denial as FlowAbandonedError with the reason', async () => {
    stubProvider({ statuses: [{ status: 'denied' }] });

    const handle = startLogin({ clientId: 'ast_x', issuer: 'https://id.zoreal.test' });
    await expect(handle.promise).rejects.toBeInstanceOf(FlowAbandonedError);
    await expect(handle.promise).rejects.toMatchObject({ reason: { type: 'request_denied' } });
  });

  it('wraps a network failure as FlowAbandonedError unknown, never OAuthFlowError', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    const handle = startLogin({ clientId: 'ast_x', issuer: 'https://id.zoreal.test' });
    await expect(handle.promise).rejects.toMatchObject({
      reason: { type: 'unknown', description: 'Failed to fetch' },
    });
  });

  it('cancel() stops the poll and rejects with AbortError', async () => {
    useFakePollTimers();
    const { fetchMock } = stubProvider({ statuses: [{ status: 'pending', expires_in: 118 }] });

    const handle = startLogin({ clientId: 'ast_x', issuer: 'https://id.zoreal.test' });
    await flush();
    const polled = fetchMock.mock.calls.length;

    handle.cancel();
    await expect(handle.promise).rejects.toMatchObject({ name: 'AbortError' });

    await vi.advanceTimersByTimeAsync(30_000);
    await flush();
    expect(fetchMock.mock.calls.length).toBe(polled);
  });

  it('the cancel carried on the state is the same control', async () => {
    useFakePollTimers();
    stubProvider({ statuses: [{ status: 'pending', expires_in: 118 }] });

    let seen: PairingState | undefined;
    const handle = startLogin({
      clientId: 'ast_x',
      issuer: 'https://id.zoreal.test',
      onState: (s) => (seen = s),
    });
    await flush();

    seen!.cancel!();
    await expect(handle.promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('startLogin, auth-code', () => {
  it('hands over code, verifier, nonce, scope and app_state without touching /token', async () => {
    const { calls } = stubProvider({ statuses: [{ status: 'approved', code: 'code-1' }] });

    const handle = startLogin({
      flow: 'auth-code',
      clientId: 'ast_x',
      issuer: 'https://id.zoreal.test',
      scope: 'openid email profile.name',
      app_state: 'return-to=/checkout',
      redirect_uri: 'https://rp.example/callback',
    });
    const result = await handle.promise;

    expect(result.code).toBe('code-1');
    expect(result.scope).toBe('openid email profile.name');
    expect(result.app_state).toBe('return-to=/checkout');

    // The verifier and nonce are the ones the pairing request was built from.
    const pairBody = JSON.parse(calls[0].init!.body as string);
    expect(pairBody.redirect_uri).toBe('https://rp.example/callback');
    expect(pairBody.nonce).toBe(result.nonce);
    expect(pairBody.code_challenge).toBe(await challengeS256(result.code_verifier));
    expect(pairBody.code_challenge_method).toBe('S256');

    expect(calls.some((c) => c.url.endsWith('/token'))).toBe(false);
  });

  it("refuses ux_mode 'redirect' loudly: the verifier never rides a URL", () => {
    expect(() =>
      startLogin({
        flow: 'auth-code',
        clientId: 'ast_x',
        ux_mode: 'redirect',
      })
    ).toThrow(/redirect.*not supported/);
  });
});
