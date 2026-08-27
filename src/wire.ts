/**
 * The wire protocol between this package and the ZOREAL OpenID Provider.
 *
 * VERSIONED: a shipped version keeps working until the provider explicitly
 * refuses it, and when it does, the reason is surfaced verbatim. Both the wire
 * version and the package version travel on every pairing request so a refusal
 * can be precise.
 *
 * Endpoints, all relative to the issuer and all CORS-gated on the client's
 * authorized JavaScript origins (the dashboard):
 *
 *   POST /pair                     start a pairing request. Body carries the
 *                                  authorize parameters plus PKCE challenge.
 *                                  Returns { request_id, pair_url, expires_in }
 *                                  or, for prompt=none with a live consented
 *                                  session, { code } immediately.
 *   GET  /pair/:id/status          poll: pending | claimed |
 *                                  approved (with code) | denied | expired |
 *                                  enrolling. Over-polling cancels the request
 *                                  rather than throttling it, so the cadence
 *                                  below is not a suggestion.
 *   GET  /pair/:id/qr.svg          the QR image for the pairing URL, served by
 *                                  the provider so the pairing surface stays
 *                                  changeable at runtime and
 *                                  this package keeps zero dependencies.
 *   POST /token                    the code exchange. Browser-direct mode uses
 *                                  it directly with PKCE and no client secret;
 *                                  auth-code mode leaves it to the RP backend.
 */

export const WIRE_VERSION = 1;
export const SDK_VERSION = '0.1.2';
export const SDK_NAME = '@zoreal/oauth2-js';
export const DEFAULT_ISSUER = 'https://id.zoreal.com';

/** Pending TTL is short. Poll gently; over-polling cancels the request. */
export const POLL_INTERVAL_MS = 2000;
/** Enrolling extends the window well beyond a normal login; poll slower. */
export const POLL_INTERVAL_ENROLLING_MS = 5000;

export interface PairCreated {
  request_id: string;
  /** https://zoreal.com/qr/<request_id>. The same URL in QR and app link. */
  pair_url: string;
  expires_in: number;
}

export interface PairImmediate {
  /** prompt=none resolved silently: consented sector, live session. */
  code: string;
}

export type PairStartResponse = PairCreated | PairImmediate;

export interface PairStatusResponse {
  status: 'pending' | 'claimed' | 'approved' | 'denied' | 'expired' | 'cancelled' | 'enrolling';
  code?: string;
  expires_in?: number;
  enrolment_deadline?: number;
  /** The provider's reason on denial or refusal. Surfaced verbatim, never rewritten. */
  error?: string;
  error_description?: string;
}

export interface TokenResponse {
  id_token: string;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}
