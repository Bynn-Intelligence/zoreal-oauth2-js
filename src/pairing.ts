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
  params: StartPairingParams
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

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('aborted', 'AbortError'));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('aborted', 'AbortError'));
    });
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
  signal?: AbortSignal
): Promise<string> {
  for (;;) {
    const response = await fetch(`${issuer}/pair/${encodeURIComponent(requestId)}/status`, {
      signal,
    });
    const body = (await parseJson(response)) as unknown as PairStatusResponse;

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
