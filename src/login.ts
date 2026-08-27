/**
 * The one flow, as an imperative handle. This is the same state machine the
 * React SDK's hook runs, without the React: start a pairing, surface it for
 * rendering through onState, poll, and finish per mode. Browser-direct
 * exchanges the code here (public client, PKCE, no secret) and hands over an
 * ID token; auth-code hands the code and the PKCE verifier to the caller,
 * whose backend does the exchange with its client authentication.
 *
 * A framework wrapper owns exactly two things: calling startLogin on the
 * user's gesture, and rendering what onState carries. Everything else -
 * PKCE, state, nonce, cadence, cancellation - lives here.
 */

import { unsafeClaims } from './jwt';
import {
  FlowAbandonedError,
  OAuthFlowError,
  exchangeCode,
  isMobileUserAgent,
  pollUntilApproved,
  startPairing,
} from './pairing';
import { mountPairingModal, type PairingModalHandle } from './modal';
import { challengeS256, generateState, generateVerifier } from './pkce';
import { DEFAULT_ISSUER } from './wire';
import type {
  AcrValue,
  AuthCodeLoginOptions,
  BrowserDirectLoginOptions,
  LoginHandle,
  SelectBy,
  ZorealCodeResponse,
  ZorealCredentialResponse,
} from './types';

export function startLogin(
  options: BrowserDirectLoginOptions
): LoginHandle<ZorealCredentialResponse>;
export function startLogin(options: AuthCodeLoginOptions): LoginHandle<ZorealCodeResponse>;
export function startLogin(
  options: BrowserDirectLoginOptions | AuthCodeLoginOptions
): LoginHandle<ZorealCredentialResponse> | LoginHandle<ZorealCodeResponse> {
  if ('ux_mode' in options && options.ux_mode === 'redirect') {
    // The popup shape only: the code and PKCE verifier resolve the promise
    // and go from there to your backend over TLS. A redirect would have to
    // carry the verifier in a URL, which is a credential in every access
    // log on the path. Refused loudly rather than implemented badly.
    throw new Error(
      "@zoreal/oauth2-js: ux_mode 'redirect' is not supported. Use the default " +
        "'popup' shape and post the code and code_verifier from the resolved " +
        'promise to your backend.'
    );
  }

  const flow = options.flow ?? 'browser-direct';
  const issuer = options.issuer ?? DEFAULT_ISSUER;
  const controller = new AbortController();

  const surface: {
    requestId?: string;
    pairUrl?: string;
    qrUrl?: string;
    appLink?: boolean;
  } = {};

  const cancel = () => controller.abort();

  // Mounted lazily once the provider has created a pairing, and torn down on
  // every exit from `run` below: resolution, refusal, and cancel alike.
  let modal: PairingModalHandle | null = null;
  const closeModal = () => {
    modal?.close();
    modal = null;
  };

  const run = async (): Promise<ZorealCredentialResponse | ZorealCodeResponse> => {
    const verifier = generateVerifier();
    const state = generateState();
    const nonce = generateState();

    try {
      const started = await startPairing(
        issuer,
        {
          client_id: options.clientId,
          scope: options.scope ?? 'openid',
          state,
          nonce,
          code_challenge: await challengeS256(verifier),
          redirect_uri:
            flow === 'auth-code' ? (options as AuthCodeLoginOptions).redirect_uri : undefined,
          acr_values: Array.isArray(options.acr_values)
            ? options.acr_values.join(' ')
            : options.acr_values,
          max_age: options.max_age,
          prompt: options.prompt,
          locale: options.locale,
        },
        controller.signal
      );

      let code: string;
      let selectBy: SelectBy = 'device';

      if ('code' in started) {
        // prompt=none resolved silently: consented sector, live session.
        code = started.code;
        selectBy = 'session';
      } else {
        const useAppLink =
          options.display === 'link' || (options.display !== 'qr' && isMobileUserAgent());
        selectBy = useAppLink ? 'app_link' : 'qr';

        surface.requestId = started.request_id;
        surface.pairUrl = started.pair_url;
        surface.qrUrl = `${issuer}/pair/${encodeURIComponent(started.request_id)}/qr.svg`;
        surface.appLink = useAppLink;

        // Everything a caller-rendered pairing UI needs, on every state it
        // sees: the QR flow cannot complete unless SOMETHING renders pairUrl,
        // and in this package that something is always the caller.
        const stateSurface = {
          pairUrl: surface.pairUrl,
          qrUrl: surface.qrUrl,
          appLink: useAppLink,
          cancel,
        };

        const initial = { status: 'pending' as const, expiresIn: started.expires_in, ...stateSurface };

        // The initial state, immediately: the first poll response is one
        // round-trip away, and a UI that waits for it opens visibly empty.
        options.onState?.(initial);

        // No modal for an app-link hand-off: there is no code to scan, the
        // phone is already being sent to the app.
        if ((options.pairingUI ?? 'modal') === 'modal' && !useAppLink) {
          modal = mountPairingModal(initial, {
            onCancel: cancel,
            locale: options.locale,
            theme: options.theme,
            timeoutMs: options.pairingTimeoutMs,
          });
        }

        if (useAppLink && typeof window !== 'undefined') {
          // The universal link, in the same tab: the app claims it, and with
          // no app installed the same URL is the real pairing page, which can
          // enrol. A popup here would be blocked more often than it would
          // help.
          window.location.assign(started.pair_url);
        }

        code = await pollUntilApproved(
          issuer,
          started.request_id,
          (s) => {
            const next = { ...s, ...stateSurface };
            modal?.update(next);
            options.onState?.(next);
          },
          controller.signal
        );
      }

      closeModal();

      if (flow === 'auth-code') {
        const response: ZorealCodeResponse = {
          code,
          scope: options.scope ?? 'openid',
          app_state: options.app_state,
          code_verifier: verifier,
          nonce,
        };
        return response;
      }

      const tokens = await exchangeCode(issuer, {
        code,
        code_verifier: verifier,
        client_id: options.clientId,
      });
      const claims = unsafeClaims(tokens.id_token);
      const response: ZorealCredentialResponse = {
        credential: tokens.id_token,
        clientId: options.clientId,
        select_by: selectBy,
        acr: (claims.acr as AcrValue) ?? 'zoreal.device',
      };
      return response;
    } catch (e) {
      closeModal();
      // The taxonomy the promise rejects with, and nothing else:
      //   OAuthFlowError      the provider refused; reason verbatim
      //   FlowAbandonedError  a human outcome, or a failure that never
      //                       reached the provider (network, unknown)
      //   AbortError          the caller's own cancel()
      if (e instanceof DOMException && e.name === 'AbortError') throw e;
      if (e instanceof OAuthFlowError || e instanceof FlowAbandonedError) throw e;
      throw new FlowAbandonedError({
        type: 'unknown',
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const promise = run();
  // A caller driving everything from onState and cancel() may never attach a
  // rejection handler; this no-op one keeps a cancelled login from surfacing
  // as an unhandled rejection. The caller's own catch still sees the error.
  promise.catch(() => {});

  return {
    promise: promise as Promise<ZorealCredentialResponse> & Promise<ZorealCodeResponse>,
    cancel,
    get requestId() {
      return surface.requestId;
    },
    get pairUrl() {
      return surface.pairUrl;
    },
    get qrUrl() {
      return surface.qrUrl;
    },
    get appLink() {
      return surface.appLink;
    },
  };
}
