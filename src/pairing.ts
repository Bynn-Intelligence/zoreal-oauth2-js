/**
 * The pairing channel, client side. wire.ts pins the endpoints.
 *
 * The browser polls; the phone never talks to the browser. Everything here is
 * therefore plain fetch against the issuer, CORS-gated on the client's
 * authorized origins, with the poll cadence fixed: the provider cancels an
 * over-polling request rather than throttling it, so a "retry
 * faster on error" strategy here would kill the login it is trying to save.
 */

import {
  POLL_INTERVAL_ENROLLING_MS,
  POLL_INTERVAL_MS,
  SDK_NAME,
  SDK_VERSION,
  WIRE_VERSION,
  type PairDisplay,
  type PairStartResponse,
  type PairStatusResponse,
  type TokenResponse,
} from './wire';
import type { ErrorCode, NonOAuthError, PairingState } from './types';

export class OAuthFlowError extends Error {
  constructor(
    public error: ErrorCode,
    public description?: string
  ) {
    super(description ?? error);
  }
}

export class FlowAbandonedError extends Error {
  constructor(public reason: NonOAuthError) {
    super(reason.description ?? reason.type);
  }
}

export interface StartPairingParams {
  client_id: string;
  scope: string;
  state: string;
  nonce: string;
  code_challenge: string;
  redirect_uri?: string;
  acr_values?: string;
  max_age?: number;
  prompt?: string;
  locale?: string;
  /**
   * Which surface the caller will show: 'qr' binds the pairing to moving QR
   * frames, 'link' to a start token only the opened link carries. Decided
   * before the request, because the provider binds it at creation and will
   * not serve the other surface afterwards. Omitting it gets the static code.
   */
  display?: PairDisplay;
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function startPairing(
  issuer: string,
  params: StartPairingParams,
  signal?: AbortSignal
): Promise<PairStartResponse> {
  const response = await fetch(`${issuer}/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      code_challenge_method: 'S256',
      wire_version: WIRE_VERSION,
      sdk: `${SDK_NAME}/${SDK_VERSION}`,
    }),
    signal,
  });

  const body = await parseJson(response);
  if (!response.ok) {
    // The provider's words, verbatim. A refused package version arrives here,
    // and rewriting its reason would hide the only signal telling an integrator
    // to upgrade.
    throw new OAuthFlowError(
      (body.error as ErrorCode) ?? 'server_error',
      (body.error_description as string) ?? `The provider refused the request (${response.status})`
    );
  }
  return body as unknown as PairStartResponse;
}

/**
 * The same-device sign-in, as a URL to NAVIGATE to, not to fetch.
 *
 * A phone's browser hands a universal link to an app only inside a
 * navigation the person began, and a page that sets its location after a
 * network round trip has left that navigation behind: the link then loads
 * as a web page. So on a phone this package fetches nothing on the tap. The
 * tap itself navigates to the provider's start endpoint with what /pair
 * would have been sent, the provider creates the link pairing and answers
 * with a redirect to its universal link, still inside the person's
 * navigation, and the app opens. The page is not unloaded when it does, and
 * polls the pairing by the `request_id` it chose here. With no app installed
 * the same redirect lands on the page that installs it.
 */
export function sameDeviceStartUrl(
  issuer: string,
  params: StartPairingParams & { request_id: string; origin: string }
): string {
  const query = new URLSearchParams();
  const all: Record<string, unknown> = {
    ...params,
    code_challenge_method: 'S256',
    wire_version: WIRE_VERSION,
    sdk: `${SDK_NAME}/${SDK_VERSION}`,
  };
  for (const [key, value] of Object.entries(all)) {
    if (value === undefined || value === null || value === '') continue;
    query.set(key, String(value));
  }
  return `${issuer}/pair/start?${query.toString()}`;
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('aborted', 'AbortError'));
      return;
    }
    // The listener comes off when the sleep ends. One poll is one sleep, and a
    // pairing is dozens of polls on the SAME signal, so a listener left behind
    // per sleep accumulates for as long as the login is open.
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException('aborted', 'AbortError'));
    };
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });

/**
 * Polls until the request resolves. Returns the authorization code.
 * Throws FlowAbandonedError for the human outcomes (denied, expired,
 * enrolment abandoned) and OAuthFlowError for protocol ones.
 */
export async function pollUntilApproved(
  issuer: string,
  requestId: string,
  onState?: (state: PairingState) => void,
  signal?: AbortSignal,
  options: {
    /**
     * Same-device navigation only. The page starts polling while the
     * provider is still answering the navigation that creates the pairing,
     * so a "no such pairing" answer before this instant (epoch ms) is the
     * pairing not existing YET, and is read as pending.
     */
    tolerateUnknownUntil?: number;
  } = {}
): Promise<string> {
  for (;;) {
    const response = await fetch(`${issuer}/pair/${encodeURIComponent(requestId)}/status`, {
      signal,
    });
    const body = (await parseJson(response)) as unknown as PairStatusResponse;

    if (response.status === 404 && (options.tolerateUnknownUntil ?? 0) > Date.now()) {
      // Same-device navigation: the pairing is being created by the
      // navigation this page is polling ahead of; not there YET is pending.
      onState?.({ status: 'pending' });
      await sleep(POLL_INTERVAL_MS, signal);
      continue;
    }

    if (!response.ok) {
      throw new OAuthFlowError(
        (body.error as ErrorCode) ?? 'server_error',
        body.error_description ?? `Pairing status failed (${response.status})`
      );
    }

    onState?.({
      status: body.status,
      expiresIn: body.expires_in,
      enrolmentDeadline: body.enrolment_deadline,
    });

    switch (body.status) {
      case 'approved':
        if (!body.code) {
          throw new OAuthFlowError('server_error', 'approved with no authorization code');
        }
        return body.code;
      case 'denied':
        throw new FlowAbandonedError({ type: 'request_denied', description: body.error_description });
      case 'expired':
        throw new FlowAbandonedError({ type: 'request_expired', description: body.error_description });
      case 'cancelled':
        // The provider cancels an over-polled or abandoned request outright
        // (its pairing rows have a real cancelled state); a poll that treats
        // it as unknown spins on a dead request forever.
        throw new FlowAbandonedError({
          type: 'request_expired',
          description: body.error_description ?? 'the provider cancelled the pairing request',
        });
      case 'enrolling':
        await sleep(POLL_INTERVAL_ENROLLING_MS, signal);
        break;
      default:
        await sleep(POLL_INTERVAL_MS, signal);
    }
  }
}

/**
 * The code exchange, browser-direct mode only: a public client, PKCE and no
 * secret. What comes back can only ever be the pseudonymous tier, by
 * construction rather than by rule: personal data lives at /userinfo behind an
 * access token this mode is never issued, because personal-data scopes are
 * refused for public clients at the pairing step.
 */
export async function exchangeCode(
  issuer: string,
  input: { code: string; code_verifier: string; client_id: string }
): Promise<TokenResponse> {
  const response = await fetch(`${issuer}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      code_verifier: input.code_verifier,
      client_id: input.client_id,
    }),
  });

  const body = (await parseJson(response)) as unknown as TokenResponse;
  if (!response.ok || body.error) {
    throw new OAuthFlowError(
      (body.error as ErrorCode) ?? 'server_error',
      body.error_description ?? `Token exchange failed (${response.status})`
    );
  }
  return body;
}

/** A mobile user agent gets the app link, not a QR of its own screen. */
export function isMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}
