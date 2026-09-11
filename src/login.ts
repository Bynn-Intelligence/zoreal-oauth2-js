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
import { resolveIntent } from './intent';
import { mountPairingModal, type PairingModalHandle } from './modal';
import { challengeS256, generateState, generateVerifier } from './pkce';
import { DEFAULT_ISSUER, DEFAULT_QR_REFRESH_SECONDS } from './wire';
import type {
  AcrValue,
  AuthCodeLoginOptions,
  BrowserDirectLoginOptions,
  LoginHandle,
  PairingState,
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

  // Decided before the pairing is created, not after: the provider binds the
  // surface at creation, either moving QR frames or a start token that only
  // the opened link carries, and will not serve the other one later. It
  // depends only on the options and the user agent, so there is nothing to
  // wait for.
  const useAppLink =
    options.display === 'link' || (options.display !== 'qr' && isMobileUserAgent());
  const intent = resolveIntent(options.intent, options.scope, options.acr_values);

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
  // The QR frame refresh, once there is one. Stopped on every exit from `run`,
  // on cancel, and the moment the pairing leaves `pending`: from then on the
  // code is spent and a moving image would only distract.
  let stopRefresh: () => void = () => {};
  controller.signal.addEventListener('abort', () => stopRefresh());
  const teardown = () => {
    stopRefresh();
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
          display: useAppLink ? 'link' : 'qr',
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
        selectBy = useAppLink ? 'app_link' : 'qr';

        const requestId = started.request_id;
        const qrBase = `${issuer}/pair/${encodeURIComponent(requestId)}/qr.svg`;

        // The image moves while the pairing is pending: the provider renders
        // a new frame every few seconds and refuses an old one, which is what
        // makes a screenshot of the code useless. This package only has to
        // re-fetch it on time. Nothing to move on an app-link hand-off, and
        // nothing to move when the provider says it bound the static code.
        const animated = !useAppLink && started.display !== 'legacy';
        const qrRefreshSeconds = !animated
          ? undefined
          : typeof started.qr_refresh_seconds === 'number' && started.qr_refresh_seconds > 0
            ? started.qr_refresh_seconds
            : DEFAULT_QR_REFRESH_SECONDS;

        surface.requestId = requestId;
        surface.pairUrl = started.pair_url;
        surface.qrUrl = qrBase;
        surface.appLink = useAppLink;

        // Everything a pairing UI needs, on every state it sees. The modal
        // below renders from it, and so does a caller who has opted out with
        // pairingUI: 'none'. Read at call time rather than captured once,
        // because qrUrl changes underneath while the pairing is pending.
        const withSurface = (s: PairingState): PairingState => ({
          ...s,
          pairUrl: surface.pairUrl,
          qrUrl: surface.qrUrl,
          qrRefreshSeconds,
          appLink: useAppLink,
          intent,
          cancel,
        });

        // The last state the provider reported, so a frame refresh can emit
        // it again with only the image changed.
        let lastPolled: PairingState = { status: 'pending', expiresIn: started.expires_in };
        const initial = withSurface(lastPolled);

        // The initial state, immediately: the first poll response is one
        // round-trip away, and a UI that waits for it opens visibly empty.
        options.onState?.(initial);

        // No modal for an app-link hand-off: there is no code to scan, the
        // phone is already being sent to the app.
        if ((options.pairingUI ?? 'modal') === 'modal' && !useAppLink) {
          modal = mountPairingModal(initial, {
            onCancel: cancel,
            intent,
            locale: options.locale,
            theme: options.theme,
            timeoutMs: options.pairingTimeoutMs,
          });
        }

        if (useAppLink && typeof window !== 'undefined') {
          // The universal link, in the same tab: the app claims it, and with
          // no app installed the same URL is the real pairing page, which can
          // enrol. A popup here would be blocked more often than it would
          // help. Between the tap and this line there is one round trip, so
          // the button that was tapped should be disabled and show it is
          // working; the promise settles or rejects when the flow ends.
          window.location.assign(started.pair_url);
        }

        if (qrRefreshSeconds !== undefined) {
          // A deadline and a setTimeout chain, not setInterval. Background
          // tabs throttle timers, and an interval that comes back from a
          // throttled minute fires its backlog in one burst: several frames
          // in one tick, for nothing. Here each frame is stamped with the
          // clock when it is emitted, the next deadline is set from that
          // moment, and a tab becoming visible with its deadline already past
          // gets a current frame at once rather than whenever the throttled
          // timer gets around to it.
          const periodMs = qrRefreshSeconds * 1000;
          let due = Date.now() + periodMs;
          let timer: ReturnType<typeof setTimeout> | undefined;
          // A flag, not just a cleared timer: a caller may cancel() from
          // inside the onState below, and the stop then lands in the middle of
          // emit. Without this, the line after it would schedule the next
          // frame and the loop would outlive the login that ended it.
          let stopped = false;

          const emit = () => {
            timer = undefined;
            surface.qrUrl = `${qrBase}?t=${Date.now()}`;
            const next = withSurface(lastPolled);
            modal?.update(next);
            options.onState?.(next);
            if (stopped) return;
            due = Date.now() + periodMs;
            timer = setTimeout(emit, periodMs);
          };
          const onVisible = () => {
            if (document.visibilityState === 'visible' && timer !== undefined && Date.now() >= due) {
              clearTimeout(timer);
              emit();
            }
          };
          const hasDocument = typeof document !== 'undefined';
          if (hasDocument) document.addEventListener('visibilitychange', onVisible);

          stopRefresh = () => {
            stopped = true;
            if (timer !== undefined) clearTimeout(timer);
            timer = undefined;
            if (hasDocument) document.removeEventListener('visibilitychange', onVisible);
            stopRefresh = () => {};
          };
          timer = setTimeout(emit, Math.max(0, due - Date.now()));
        }

        code = await pollUntilApproved(
          issuer,
          requestId,
          (s) => {
            lastPolled = s;
            // Anything but pending means the code is spent: claimed and
            // enrolling have moved the action to the phone, the rest are
            // terminal. Stop before emitting so no frame lands after this.
            if (s.status !== 'pending') stopRefresh();
            const next = withSurface(s);
            modal?.update(next);
            options.onState?.(next);
          },
          controller.signal
        );
      }

      teardown();

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
      teardown();
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
