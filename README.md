# @zoreal/oauth2-js

Login with ZOREAL for the browser, framework-free: a ZOREAL Verified
Proof-of-Human behind every sign-in.

This is the wire core of
[`@zoreal/oauth2-react`](https://github.com/Bynn-Intelligence/zoreal-oauth2-react)
without the React: the pairing (QR or app link), the polling, PKCE, and the
browser-side code exchange, exposed as one imperative call. Use it directly
from plain JavaScript, or build a Vue, Svelte, or Angular wrapper on it; the
React package is what that wrapper looks like when it is finished.

```
@zoreal/oauth2-js (this package)   the flow: pairing, polling, PKCE, exchange
your wrapper or plain JS           the UI: render what onState carries
```

## Status

Early release. The package implements wire protocol v1. The hosted ZOREAL
login service is still rolling out, so treat this as a preview: the API is
stable, but end-to-end sign-in against production is not available everywhere
yet. This note is removed once the service is generally available.

## Install

```sh
npm install @zoreal/oauth2-js
```

Zero runtime dependencies. ESM and CJS. Browser APIs only (`fetch`,
`crypto.subtle`); any evergreen browser has everything it needs.

## Two flows: pick by whether you need the user's details

- **You have a backend and want the user's email or name** (most apps): use
  `flow: 'auth-code'`. Your backend gets the email, name, and verification
  details from `/userinfo`. Start here.
- **You have no backend and only need to know "this is a verified, unique
  human, and the same one as last time"**: use the default browser-direct
  flow. It returns a stable per-user identifier and proof of verification, but
  no email or name. Email and other personal details are never placed in a
  browser-side token; that is what the auth-code flow and your backend are
  for.

## Quick start: auth-code (email and name, needs your backend)

```ts
import { startLogin } from '@zoreal/oauth2-js';

// On the user's click, never on page load:
const handle = startLogin({
  flow: 'auth-code',
  clientId: 'ast_your_asset_id',
  scope: 'openid email profile.name',
  onState: (s) => {
    // Render the pairing UI from this: s.qrUrl in an <img>, s.status as text,
    // s.cancel on your close button. Every callback carries all of it.
    renderPairing(s);
  },
});

const { code, code_verifier, nonce } = await handle.promise;
// Send ALL THREE to your backend over TLS. Your backend calls POST /token
// with the code, the verifier and its client authentication, verifies the
// ID token (including the nonce), then reads email and name from /userinfo.
await fetch('/api/auth/zoreal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, code_verifier, nonce }),
});
```

## Quick start: browser-direct (no backend, pseudonymous)

```ts
import { startLogin } from '@zoreal/oauth2-js';

const handle = startLogin({
  clientId: 'ast_your_asset_id',
  onState: (s) => renderPairing(s),
});

const { credential } = await handle.promise;
// `credential` is an ID token carrying a stable per-user identifier (`sub`)
// and proof the person is a verified, unique human. No email, no name: use
// the auth-code flow above for those. Verify it on your server against the
// JWKS before trusting it.
```

On desktop, `onState` gives you a QR to render; the user scans it with their
phone and approves in the ZOREAL ID app. On a phone, `startLogin` opens the
app directly through the pairing link and the promise settles when the user
returns. Either way your page just awaits `handle.promise`.

## The handle

`startLogin` returns synchronously with everything a UI needs to drive the
flow:

| Field | What it is |
|---|---|
| `promise` | resolves with the mode's result; rejects with `OAuthFlowError`, `FlowAbandonedError`, or an `AbortError` after `cancel()` |
| `cancel()` | abandons the flow: stops the poll, rejects the promise |
| `requestId` | the pairing request id, once the provider has created it |
| `pairUrl` | the pairing link, once created. The same URL in QR and app link |
| `qrUrl` | the provider-served SVG of `pairUrl`. Put it in an `<img>`; do not draw your own |
| `appLink` | true when the flow resolved to the app link (mobile) rather than a QR |

`requestId`, `pairUrl`, `qrUrl` and `appLink` are `undefined` until the
pairing request exists (one round-trip), and stay `undefined` when
`prompt: 'none'` resolves silently. The same four values also arrive on every
`onState` callback, which is the reliable place to render from.

`onState` receives a `PairingState` on every change:
`status` (`pending | claimed | approved | denied | expired | enrolling`),
`expiresIn`, `enrolmentDeadline`, `pairUrl`, `qrUrl`, `appLink`, and
`cancel`.

## What resolves, per mode

Browser-direct:

```ts
{ credential: string,   // the ID token; verify server-side against the JWKS
  clientId: string,
  select_by: 'qr' | 'app_link' | 'device' | 'session',
  acr: 'zoreal.live' | 'zoreal.device' | 'zoreal.session' }
```

Auth-code:

```ts
{ code: string,          // single-use, short-lived
  code_verifier: string, // PKCE; your backend needs it to complete the exchange
  nonce: string,         // your backend checks it against the ID token's nonce claim
  scope: string,
  app_state?: string }   // whatever you passed in, echoed back
```

`ux_mode: 'redirect'` is not supported: it would put the PKCE verifier in a
URL, which is a credential in every access log on the path. `startLogin`
throws rather than doing that.

## API

| Export | What it does |
|---|---|
| `startLogin(options)` | the whole flow: pairing, polling, and (browser-direct) the exchange. Returns the handle above |
| `startPairing(issuer, params)` | `POST {issuer}/pair`, returns `{ request_id, pair_url, expires_in }` or an immediate `{ code }` |
| `pollUntilApproved(issuer, requestId, onState?, signal?)` | polls `/pair/:id/status` at the fixed cadence until a code or a terminal state |
| `exchangeCode(issuer, { code, code_verifier, client_id })` | `POST {issuer}/token`: public client, PKCE, no secret |
| `generateVerifier()` / `challengeS256(v)` / `generateState()` | PKCE and state material, S256 only |
| `unsafeClaims(idToken)` | reads claims without verifying. Convenience only; verification happens server-side |
| `isMobileUserAgent()` | whether this user agent gets the app link rather than a QR |

Errors: `OAuthFlowError` (the provider refused; `error` is the OAuth code,
`description` is the provider's reason verbatim) and `FlowAbandonedError` (a
human outcome: `reason.type` is `request_denied`, `request_expired`,
`enrolment_abandoned`, or `unknown` for failures that never reached the
provider). `cancel()` rejects with a `DOMException` named `AbortError`.

All types are exported: `PairingState`, `ZorealCredentialResponse`,
`ZorealCodeResponse`, `StartLoginOptions`, `BrowserDirectLoginOptions`,
`AuthCodeLoginOptions`, `LoginHandle`, `ErrorCode`, `NonOAuthError`,
`SelectBy`, `AcrValue`, and the wire shapes.

## Writing a framework wrapper

A wrapper owns exactly two things: calling `startLogin` on the user's
gesture, and rendering what `onState` carries. Everything else - PKCE, state,
nonce, poll cadence, cancellation - is this package's job. A minimal Vue 3
composable:

```ts
// useZorealLogin.ts
import { onUnmounted, ref } from 'vue';
import {
  startLogin,
  type PairingState,
  type ZorealCredentialResponse,
} from '@zoreal/oauth2-js';

export function useZorealLogin(clientId: string) {
  const pairing = ref<PairingState | null>(null);
  const credential = ref<ZorealCredentialResponse | null>(null);
  const error = ref<string | null>(null);
  let active: { cancel: () => void } | null = null;

  const login = () => {
    active?.cancel();
    const handle = startLogin({
      clientId,
      onState: (s) => (pairing.value = s),
    });
    active = handle;
    handle.promise
      .then((r) => (credential.value = r))
      .catch((e) => {
        if (e?.name !== 'AbortError') error.value = e.message;
      })
      .finally(() => (pairing.value = null));
  };

  // A component unmounting mid-login must stop the poll: the provider
  // cancels over-polled requests, and an orphaned poll is how one happens.
  onUnmounted(() => active?.cancel());

  return { login, pairing, credential, error };
}
```

And the template renders the state:

```vue
<template>
  <button @click="login">Continue with ZOREAL</button>
  <div v-if="pairing">
    <img v-if="!pairing.appLink" :src="pairing.qrUrl" alt="Scan with the ZOREAL ID app" />
    <p>{{ pairing.status }}</p>
    <button @click="pairing.cancel">Cancel</button>
  </div>
</template>
```

The same shape ports to Svelte (a store fed by `onState`) or Angular (a
service exposing an observable). The rules a wrapper must keep:

- Render `qrUrl` in an `<img>`; never draw your own QR of `pairUrl`.
- Call `cancel()` on unmount or navigation. Do not add your own retry loop:
  the poll cadence is fixed because over-polling cancels the request
  server-side.
- Show `description` from errors verbatim. It is the provider's own reason,
  and rewriting it hides the only signal telling an integrator what happened.

## What your page needs to allow

The package loads no third-party script, no stylesheet, no font, and has zero
runtime dependencies. Two things touch the network, both on the ZOREAL
origin:

| CSP directive | Value | Why |
|---|---|---|
| `connect-src` | `https://id.zoreal.com` | starting the pairing, polling it, and (browser-direct) the code exchange |
| `img-src` | `https://id.zoreal.com` | the QR image, served by the provider so it stays correct and current |

## Things worth knowing before you integrate

- **The ID token never carries personal data.** `sub`, timing, `acr`/`amr`,
  the assurance block, and - if registered - `age_over_*` booleans and
  `nationality`. Email, names, birthdate and document fields come only from
  `/userinfo`, read by your backend in the auth-code flow.
- **The access token lives 10 minutes.** Your backend should read `/userinfo`
  while handling the login, not store the token for later.
- **`sub` is pairwise per verified domain.** It is the right account key and
  it is derived from your registered sector: changing your asset's domain
  rotates every `sub` you have stored. Plan domain changes as a migration.
- **ES256 only.** The provider signs ID tokens with nothing else, and your
  backend should refuse other algorithms rather than negotiating.
- **Always hand the nonce to your backend.** This package generates it and
  resolves it alongside the code; without it your backend cannot tell a
  substituted ID token from the real one.
- **Email is a deliberate choice.** It is a Tier B scope precisely because a
  shared email defeats the unlinkability the pairwise `sub` provides. Request
  it because you need it, not because the checkbox is familiar.
- **Sandbox clients accept localhost origins; production clients do not.**
  Registration lives in the ZOREAL dashboard on the asset's OAuth2 tab; Tier B
  scopes (email, profile.\*) need a confidential client on a verified domain,
  and a public client requesting them is refused at the pairing step.
- **No secret has a home here.** `startLogin` takes no client secret and
  never will. Browser-direct mode is a public client with PKCE; auth-code
  mode leaves client authentication to your backend, where the secret lives.
- **The poll cadence is not a suggestion.** 2000ms while pending, 5000ms
  while enrolling. The provider cancels an over-polling request rather than
  throttling it, so polling faster kills the login it is trying to save.

## The ZOREAL OAuth2 library family

| Repository | Package | Role |
|---|---|---|
| zoreal-oauth2-react | @zoreal/oauth2-react (npm) | React frontend: the button, the QR, the polling |
| zoreal-oauth2-js | @zoreal/oauth2-js (npm) | Framework-free browser core |
| zoreal-oauth2-react-native | @zoreal/oauth2-react-native (npm) | React Native frontend |
| zoreal-oauth2-node | @zoreal/oauth2-node (npm) | Node.js backend |
| zoreal-oauth2-ruby | zoreal-oauth2 (RubyGems) | Ruby backend |
| zoreal-oauth2-python | zoreal-oauth2 (PyPI) | Python backend |
| zoreal-oauth2-php | zoreal/oauth2 (Packagist) | PHP backend |
| zoreal-oauth2-go | github.com/Bynn-Intelligence/zoreal-oauth2-go | Go backend |
| zoreal-oauth2-java | com.zoreal:oauth2 (Maven Central) | JVM backend |
| zoreal-oauth2-dotnet | Zoreal.OAuth2 (NuGet) | .NET backend |

## Development against a local provider

Pass `issuer` to `startLogin` . The issuer value must match the `iss` inside the
tokens exactly - it is compared, not normalized. Sandbox clients accept any
localhost origin.

## License

MIT.
