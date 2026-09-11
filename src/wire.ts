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
 *                                  authorize parameters plus PKCE challenge,
 *                                  and `display`: which pairing surface this
 *                                  package is about to show, 'qr' or 'link',
 *                                  decided before the request is made. Returns
 *                                  { request_id, pair_url, expires_in, display,
 *                                  qr_refresh_seconds } or, for prompt=none
 *                                  with a live consented session, { code }
 *                                  immediately. `display` is echoed as the
 *                                  provider bound it ('legacy' for a request
 *                                  that sent none, which gets the static code
 *                                  older versions of this package showed).
 *                                  `qr_refresh_seconds` comes with 'qr' and is
 *                                  how often to re-fetch the image; 3 today.
 *                                  A 'link' pairing's pair_url carries
 *                                  ?t=<start_token>: it can only be claimed by
 *                                  the app that opened that exact link, and
 *                                  the provider never renders a QR for it, so
 *                                  nobody can turn a same-device link into a
 *                                  static code to relay.
 *   GET  /pair/start               the same-device sign-in as a NAVIGATION:
 *                                  the /pair parameters as a query, plus
 *                                  request_id (the page's own token) and
 *                                  origin; answered with a redirect to the
 *                                  pairing's universal link, inside the tap
 *   GET  /pair/:id/status          poll: pending | claimed |
 *                                  approved (with code) | denied | expired |
 *                                  enrolling. Over-polling cancels the request
 *                                  rather than throttling it, so the cadence
 *                                  below is not a suggestion.
 *   GET  /pair/:id/qr.svg          the QR image, rendered by the provider so
 *                                  this package draws nothing and keeps zero
 *                                  dependencies. For a 'qr' pairing it encodes
 *                                  the CURRENT FRAME, the pairing URL with
 *                                  ?f=<time>.<hmac>: `time` is whole seconds
 *                                  since the pairing was created on the
 *                                  provider's clock, `hmac` is keyed with a
 *                                  secret only the provider holds. Served
 *                                  Cache-Control: no-store, only while the
 *                                  pairing is pending. The app sends the frame
 *                                  it scanned with its claim, and the provider
 *                                  refuses a frame older than 30 seconds, so a
 *                                  screenshot of the code is dead on arrival.
 *                                  This package re-fetches the image every
 *                                  `qr_refresh_seconds` with a cache-busting
 *                                  ?t=<Date.now()>. A 'link' pairing has no
 *                                  image (404).
 *   POST /token                    the code exchange. Browser-direct mode uses
 *                                  it directly with PKCE and no client secret;
 *                                  auth-code mode leaves it to the RP backend.
 */

export const WIRE_VERSION = 1;
export const SDK_VERSION = '0.1.19';
export const SDK_NAME = '@zoreal/oauth2-js';
export const DEFAULT_ISSUER = 'https://id.zoreal.com';

/** Pending TTL is short. Poll gently; over-polling cancels the request. */
export const POLL_INTERVAL_MS = 2000;
/** Enrolling extends the window well beyond a normal login; poll slower. */
export const POLL_INTERVAL_ENROLLING_MS = 5000;
/**
 * How often the QR image is re-fetched while a pairing is pending, when the
 * provider does not say. The provider's own `qr_refresh_seconds` wins when
 * present. Refreshing is what makes the code on screen move, and a frame the
 * provider refuses after 30 seconds is what makes a screenshot of it useless.
 */
export const DEFAULT_QR_REFRESH_SECONDS = 3;

/** The pairing surface this package will show, sent on POST /pair. */
export type PairDisplay = 'qr' | 'link';

export interface PairCreated {
  request_id: string;
  /**
   * https://zoreal.com/login/<request_id>. For a 'link' pairing the URL also
   * carries ?t=<start_token>, and only the app that opens that exact link can
   * claim it. Navigate to it verbatim.
   */
  pair_url: string;
  expires_in: number;
  /**
   * The surface the provider bound, echoed back. 'legacy' means the request
   * sent no `display` (an older version of this package) and got the static
   * code. Absent from a provider that predates the field, which also serves
   * the static code.
   */
  display?: PairDisplay | 'legacy';
  /** 'qr' pairings only: how often to re-fetch qr.svg. Defaults to 3 when absent. */
  qr_refresh_seconds?: number;
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
  /**
   * The provider's reason on denial or refusal. Surfaced verbatim, never
   * rewritten: it is also how a site's own policy reaches the person, such
   * as a sign-in refused because the phone that approved it was in a
   * different country than the browser.
   */
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
