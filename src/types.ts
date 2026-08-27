/**
 * The public types of @zoreal/oauth2-js.
 *
 * This package is the framework-free browser core of the family: the same
 * wire, states, and error taxonomy as @zoreal/oauth2-react, without the React.
 * A framework wrapper (Vue, Svelte, Angular) builds its UI on `startLogin`
 * and shares these types with the React SDK name for name.
 */

export type ErrorCode =
  | 'invalid_request'
  | 'access_denied'
  | 'unauthorized_client'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable'
  // The OIDC interaction errors. prompt=none answers with these when no
  // silent session exists, which is the expected quiet outcome for a silent
  // re-auth attempt, not a failure.
  | 'login_required'
  | 'consent_required'
  | 'interaction_required';

/** Failures that are not OAuth errors, because the flow never reached the provider. */
export type NonOAuthError = {
  type:
    | 'popup_failed_to_open'
    | 'popup_closed'
    | 'request_expired' // the pairing request timed out before approval
    | 'request_denied' // the holder declined in the app
    | 'enrolment_abandoned' // the user started enrolling and did not finish
    | 'platform_unsupported' // iOS, until ZOREAL ID ships there
    | 'unknown';
  /** The provider's own reason string. Render it. Never substitute a friendlier guess. */
  description?: string;
};

/** How the holder reached this login. */
export type SelectBy = 'qr' | 'app_link' | 'device' | 'session';

/** How the login was actually authenticated. Describes what happened, never what was requested. */
export type AcrValue = 'zoreal.live' | 'zoreal.device' | 'zoreal.session';

export interface PairingState {
  status: 'pending' | 'claimed' | 'approved' | 'denied' | 'expired' | 'cancelled' | 'enrolling';
  /** Present while status is 'pending'. Seconds. */
  expiresIn?: number;
  /** Present while status is 'enrolling'. Enrolment extends the window well beyond a normal login. */
  enrolmentDeadline?: number;
  /**
   * The pairing link and its provider-served QR image. Present on every
   * callback of a QR/link flow: the QR flow cannot complete unless SOMETHING
   * renders pairUrl, and in this package that something is always the caller.
   */
  pairUrl?: string;
  /** The provider-served SVG of pairUrl. Put it in an <img>; do not draw your own. */
  qrUrl?: string;
  /** True when the flow resolved to the app link (mobile) rather than a QR. */
  appLink?: boolean;
  /** Abandons this pairing: stops the poll. Wire it to your UI's cancel control. */
  cancel?: () => void;
}

export interface ZorealCredentialResponse {
  /** The ID token. Verify it server-side against the JWKS before trusting it. */
  credential: string;
  clientId: string;
  select_by: SelectBy;
  /** Convenience, parsed from the token. The token stays the authority. */
  acr: AcrValue;
}

export interface ZorealCodeResponse {
  code: string;
  scope: string;
  app_state?: string;
  /**
   * The PKCE verifier for this code. Post it to your backend with the code;
   * the backend sends both to /token along with its client authentication.
   * PKCE is mandatory for every client, and the verifier is generated here, so
   * your server can only complete the exchange if this hands it over. It travels
   * to YOUR backend over TLS and nowhere else.
   */
  code_verifier: string;
  /**
   * The nonce this package generated for this flow. The ID token carries it,
   * and without handing it over the backend doing the exchange has no way to
   * check the token it receives was minted for this login rather than
   * substituted. Verify it against the ID token's nonce claim, alongside iss,
   * aud and exp. Same travel rule as code_verifier.
   */
  nonce: string;
}

export interface StartLoginOptions {
  /** The asset token from the ZOREAL dashboard, ast_... */
  clientId: string;
  /** Defaults to https://id.zoreal.com. Sandbox and self-hosted providers override it. */
  issuer?: string;
  /** Defaults to 'openid'. Scopes that return personal data require flow: 'auth-code'. */
  scope?: string;
  /** Ask for a specific assurance. Omit to accept the default, zoreal.device. */
  acr_values?: AcrValue | AcrValue[];
  /** Seconds. Forces re-authentication when auth_time is older. */
  max_age?: number;
  prompt?: 'none' | 'login' | 'consent';
  /** Echoed back. Not a CSRF token: the package generates its own state and PKCE verifier. */
  app_state?: string;
  /** 'auto' renders a QR on desktop and an app link on mobile, which is what you want. */
  display?: 'auto' | 'qr' | 'link';
  /** Sent to the provider so the pairing surface speaks the visitor's language. */
  locale?: string;
  /** Called on each pairing state change. Drive your UI from this. */
  onState?: (state: PairingState) => void;
}

export interface BrowserDirectLoginOptions extends StartLoginOptions {
  flow?: 'browser-direct';
}

export interface AuthCodeLoginOptions extends StartLoginOptions {
  flow: 'auth-code';
  /** Must be registered for this client in the ZOREAL dashboard. */
  redirect_uri?: string;
  ux_mode?: 'popup' | 'redirect';
}

/**
 * What startLogin returns, synchronously. The promise settles when the flow
 * does; requestId, pairUrl, qrUrl and appLink fill in once the provider has
 * created the pairing request (they also arrive on every onState callback,
 * which is the reliable place to render from).
 */
export interface LoginHandle<T> {
  /**
   * Resolves with the mode's result: a ZorealCredentialResponse in
   * browser-direct mode, a ZorealCodeResponse in auth-code mode. Rejects with
   * OAuthFlowError (the provider refused, reason verbatim),
   * FlowAbandonedError (a human outcome: denied, expired, abandoned), or a
   * DOMException named AbortError after cancel().
   */
  promise: Promise<T>;
  /** Abandons the flow: stops the poll and rejects the promise with AbortError. */
  cancel: () => void;
  /** The pairing request id, once created. Undefined before, and for prompt=none immediate codes. */
  readonly requestId: string | undefined;
  /** The pairing URL, once created. The same URL in QR and app link. */
  readonly pairUrl: string | undefined;
  /** The provider-served QR image of pairUrl. */
  readonly qrUrl: string | undefined;
  /** True when display resolved to the app link rather than the QR. */
  readonly appLink: boolean | undefined;
}
