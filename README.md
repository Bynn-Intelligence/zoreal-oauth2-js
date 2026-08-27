# @zoreal/oauth2-js

[![npm](https://img.shields.io/npm/v/@zoreal/oauth2-js)](https://www.npmjs.com/package/@zoreal/oauth2-js) [![types](https://img.shields.io/npm/types/@zoreal/oauth2-js)](https://www.npmjs.com/package/@zoreal/oauth2-js) [![CI](https://img.shields.io/github/actions/workflow/status/Bynn-Intelligence/zoreal-oauth2-js/ci.yml?branch=main&label=CI)](https://github.com/Bynn-Intelligence/zoreal-oauth2-js/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

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

## Install

```sh
npm install @zoreal/oauth2-js
```

Zero runtime dependencies. ESM and CJS. Browser APIs only (`fetch`,
`crypto.subtle`); any evergreen browser has everything it needs.

## Getting your credentials

`clientId` is the only credential this package needs, and it comes from a ZOREAL
**asset**.

1. Create an account at **https://zoreal.com** and open **Assets**.
2. **Create an asset** — a *website* (a domain you own) or an *app bundle* (a
   reverse-DNS bundle id). An asset is the thing users log in to; its token is
   your `clientId` and it looks like `ast_...`.
3. On the asset, open the **OAuth2** tab and set:
   - the **JavaScript origins** this page is served from and the **redirect
     URIs** your app uses — requests from anything not registered are rejected,
     which is the core control,
   - the **scopes** the client may request (see the catalogue below); a request
     for a scope not on the list is refused at the pairing step,
   - **client authentication** — for the auth-code flow, generate a **client
     secret** or register a **JWKS** on the asset. That credential lives on your
     backend and never comes here. Browser-direct is a public client: PKCE
     alone, no secret.
4. A website asset must **verify its domain** (a DNS or meta-tag proof, shown in
   the dashboard) before it can request personal-data scopes or sign users in;
   the verified domain is what your users' `sub` is pairwise against.

`clientId` is public by design — it ships in your frontend, and this package
takes nothing else. No client secret has a home in the browser (see *No secret
has a home here*, below).

### There is no test-identity sandbox — and that is deliberate

ZOREAL **never issues fake or sandbox humans**: a pool of test identities would
be a fraud vector against the exact thing the product proves. So you always
authenticate **real** ZOREAL IDs.

To develop and test, **create a free ZOREAL ID for yourself** (enrol in the
ZOREAL ID app) and sign in with it. Mark your asset's environment **sandbox** in
the dashboard while building — a sandbox asset may register `http://localhost`
origins and redirect URIs that a production asset may not — and flip it to
production when you ship. The identities are real either way; only the allowed
origins differ. There is no mock provider and no hosted test issuer to point at:
the issuer is `https://id.zoreal.com` in every environment.

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

## Scopes and claims

Scopes are the `scope` string you pass to `startLogin` (always starting with
`openid`), consented to by the holder, and pre-authorized on your asset. What
each grants and where it is delivered:

| Scope | Claims | Delivered in | Tier | Requires |
|---|---|---|---|---|
| `openid` | `sub`, `iss`, `aud`, `exp`, `iat`, `nonce`, `auth_time`, `acr`, `amr`, and the assurance block | ID token | A | any client |
| `zoreal.age` | `age_over_13/16/18/21/65` booleans — only the thresholds you registered, never an age or birthdate | ID token | A | any client |
| `zoreal.nationality` | `nationality` (ISO 3166-1 alpha-3) | ID token | A | any client |
| `email` | `email`, `email_verified` | `/userinfo` | B | confidential client + verified domain |
| `profile.name` | `name`, `given_name`, `family_name` | `/userinfo` | B | confidential client + verified domain |
| `profile.birthdate` | `birthdate` (full ISO 8601 date) | `/userinfo` | B | confidential client + verified domain |
| `profile.document` | `document_type`, `document_number`, `issuing_country`, `document_expires_on` | `/userinfo` | B | confidential client + verified domain |
| `profile.portrait` | `portrait` (the chip's facial image; GDPR Article 9 data) | `/userinfo` | C | confidential client + verified domain — *registrable but not served yet* |

- **Tier A** rides in the ID token and is available to every client, so the
  browser-direct flow can use it with no backend at all. **Tier B and C** are
  personal data, served only from `/userinfo` to a confidential client on a
  domain you have verified, and never placed in a browser token — which is why
  any scope beyond Tier A needs `flow: 'auth-code'` and your backend. A public
  client that asks for one is refused at the pairing step with `invalid_scope`.
- **Age thresholds are a fixed set** — 13, 16, 18, 21, 65 — that you register on
  the asset. The `age_over_*` claim for a threshold you did not register is
  simply absent (no claim was minted), which a backend reads as `null`/`nil`
  rather than `false`.

## Assurance levels — `acr` and requiring a liveness check

### What `acr` is

`acr` is an OpenID Connect standard claim — *Authentication Context Class
Reference*. It is a string in the ID token that says **how strongly this login
was authenticated**. `sub` tells you *who* (a stable, pairwise identifier for
this person at your site); `acr` tells you *how sure ZOREAL is that the person is
really there for this login*. A stolen, unlocked phone can still produce a `sub`;
it cannot produce a fresh `zoreal.live`.

This core is the **request** side of `acr`: you ask for a level via
`startLogin`, which decides what the holder's ZOREAL ID app makes them do.
Whether it was reached is decided by the signed token and checked on your
backend.

### The three levels

Weakest to strongest. `acr` reports what actually happened, never what was asked.

| `acr` | What the holder did | `amr` | Proves | Does **not** prove |
|---|---|---|---|---|
| `zoreal.session` | Nothing — a returning holder resumed silently from an existing ZOREAL session, no phone interaction | `[]` | Continuity | Presence |
| `zoreal.device` | Approved on their enrolled phone: a secure-element key signature released by a local biometric/passcode unlock | `["hwk","user"]` | Possession of the enrolled device **and** a local unlock | That a live face was captured for *this* login |
| `zoreal.live` | The above **plus** a fresh face capture this login — a flash-plus-zoom video scored for presentation attacks and screen replay, matched 1:1 to the government document read at enrolment | `["hwk","face","user"]` | A live, real, unique human, verified to be the enrolled person, **at the moment of this login** | — (strongest) |

`amr` (*Authentication Methods References*) lists the factors: `hwk` a hardware
key, `user` a presence/unlock gesture, `face` a face biometric. `zoreal.live` is
`zoreal.device` with `face` added. The default is `zoreal.device`.

### When to request which

- **`zoreal.device`** (the default): a forum, a community, a normal login. Pass
  no `acr_values`.
- **`zoreal.live`**: a bank onboarding, a high-value transaction, an age-gated
  purchase, a first login, a "confirm it is really you" step.
- **`zoreal.session`** is never *requested*; it is the silent convenience re-auth
  (`prompt: 'none'`) a returning holder gets at a consented site.

### Requesting it here

`acr_values` is an option on `startLogin`, typed `AcrValue | AcrValue[]` where
`AcrValue = 'zoreal.live' | 'zoreal.device' | 'zoreal.session'`.

```ts
const handle = startLogin({
  clientId: 'ast_your_asset_id',
  acr_values: 'zoreal.live',        // the app now makes the holder pass a face capture
  onState: (s) => renderPairing(s),
});
```

In browser-direct mode the resolved level is on the credential response as
`acr`, parsed from the ID token; the token stays the authority.

### Requesting is not verifying — the rule that matters

`acr_values` here is **advisory**: it shapes what the holder is asked to do, and
proves nothing on its own, because a browser is attacker-controlled. The proof is
the **signed `acr` claim**, minted by ZOREAL, verified on your **backend** — the
ZOREAL backend libraries (`zoreal-oauth2` for Ruby and its siblings for Node,
Python, PHP, Go, JVM and .NET) take a required-acr argument at exchange and
refuse a token below the level. A relying party that requests `zoreal.live` but
never verifies the claim has checked nothing.

### `acr` versus the assurance block

`acr` grades *this login event*. The assurance block in the token (uniqueness
basis, verification month, chip-liveness, trust tier, key protection) describes
the *identity behind it*. One is about now; the other about who they are. A
high-value flow wants both.

## The assurance block

The ID token carries a `zoreal` claim — the **assurance block** — describing the
strength of the *identity* behind this login, distinct from `acr`, which grades
the *login event*. In browser-direct mode you can read it for display with
`unsafeClaims(credential).zoreal` (convenience only — the token is the authority
once your backend has verified it); in the auth-code flow your backend reads it
from the verified token. Its keys and their value sets:

| Key | Values | Meaning |
|---|---|---|
| `uniqueness` | `personal_number` \| `document` \| `none` | The anchor the holder is deduplicated on. `personal_number` (a national number from the chip) is strongest; `none` means no reliable anchor |
| `verified_on` | `"YYYY-MM"` | The month the underlying document was verified. Quantised to a month on purpose — a day-precision date is a cross-site correlator |
| `chip_liveness_proven` | `true` \| `false` | Whether the passport chip's active-authentication challenge was proven (a genuine chip, not a clone) |
| `trust_tier` | `high` \| `standard` | `high` when `chip_liveness_proven`, else `standard` |
| `key_protection` | `secure_enclave` \| `strongbox` \| `tee` \| `software` | How the holder's device key is protected. `software` means no hardware attestation |

A high-value flow usually pairs `acr_values: 'zoreal.live'` (fresh presence)
with a check on the assurance block (identity strength) — e.g. requiring
`uniqueness === 'personal_number'` and `trust_tier === 'high'`. Both checks are
enforced where enforcement counts: on your backend, against the verified token.

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

## Error reference

### At `/token`

The code exchange can fail with these OAuth codes. In **browser-direct** mode
this package makes the `/token` call for you (`exchangeCode`), and a failure
arrives as an `OAuthFlowError` whose `error` is one of these. In **auth-code**
mode the `/token` call is your backend's, and it sees the same codes there.

| `error` | Cause | Retryable? |
|---|---|---|
| `invalid_grant` | The code is spent — unknown, expired (60s), already used, PKCE mismatch, or the asset's domain verification lapsed mid-flow | No. Start a **new** login; the code cannot be reused |
| `invalid_request` | Client authentication failed — wrong secret, a bad `private_key_jwt` assertion, or `tls_client_auth` (not accepted at `/token` yet). A backend-side concern; browser-direct is a public client and never authenticates | No. Fix the backend's client configuration |
| `unsupported_grant_type` | Something other than `authorization_code` reached `/token` | No. A bug |

### Before the exchange — surfaced in the browser

These come back from the pairing step, before any code exists, and are what your
UI handles directly:

| Where | Code / reason | This package | Meaning |
|---|---|---|---|
| `/pair` | `invalid_scope` | `OAuthFlowError` | A scope not on the asset's allowed list, or a Tier B scope from a public client |
| `/pair` | `invalid_request` | `OAuthFlowError` | Missing PKCE/nonce, an unverified sector, an unregistered `redirect_uri`, or an unknown `acr_values` |
| `/pair` | `login_required` | `OAuthFlowError` | `prompt: 'none'` with no silent session to resume — the expected quiet outcome, not a failure |
| pairing | `request_denied` | `FlowAbandonedError` | The holder declined in their ZOREAL ID app — **not an error to alarm on**; offer to try again |
| pairing | `request_expired` | `FlowAbandonedError` | The pairing window elapsed, or a required liveness the device could not meet — offer to try again |

### This package's error classes

- **`OAuthFlowError`** — the provider refused. `error` is the OAuth code (an
  `ErrorCode`), and `description` is the provider's own reason string. Render
  `description` verbatim; it is the only signal that tells an integrator what to
  fix (a refused package version arrives this way too).
- **`FlowAbandonedError`** — a *human* outcome, or a failure that never reached
  the provider. `reason.type` is `request_denied`, `request_expired`,
  `enrolment_abandoned`, or `unknown`, and `reason.description` carries the
  provider's words when there are any. `request_denied` and `request_expired`
  are the everyday cancel/timeout paths — treat them as "offer to try again",
  not as faults to log at error level.
- **`AbortError`** — a `DOMException` named `AbortError`, thrown when *you* call
  `handle.cancel()` (or the `cancel()` on a `PairingState`). It means the flow
  was abandoned on purpose; check `e.name === 'AbortError'` and stay silent.

The two paths that are **not** failures are a user closing the dialog
(`AbortError`) and a holder declining (`FlowAbandonedError` with
`request_denied`). Everything a real integration should surface to the user as an
error is an `OAuthFlowError`, or the rare `FlowAbandonedError` of type `unknown`.

## A complete example

A whole "Continue with ZOREAL" control in plain TypeScript — no framework — that
runs the auth-code flow, shows the pairing UI from `onState`, and hands
`{ code, code_verifier, nonce }` to your backend. **Your backend is where the
login is actually verified**: it exchanges the code at `/token` with its client
authentication, checks the ID token's signature, `iss`, `aud`, `exp` and
`nonce` against the JWKS, and reads `/userinfo`. Nothing the browser resolves is
trusted until it has.

```ts
import {
  startLogin,
  OAuthFlowError,
  FlowAbandonedError,
  type PairingState,
} from '@zoreal/oauth2-js';

export function mountZorealButton(root: HTMLElement) {
  const button = document.createElement('button');
  button.textContent = 'Continue with ZOREAL';
  const panel = document.createElement('div'); // holds the pairing UI
  root.append(button, panel);

  let handle: ReturnType<typeof startLogin> | null = null;

  const renderPairing = (s: PairingState) => {
    panel.replaceChildren();
    if (s.appLink) {
      panel.textContent = 'Opening the ZOREAL ID app…';
      return;
    }
    if (s.qrUrl) {
      const img = document.createElement('img');
      img.src = s.qrUrl; // provider-served; never draw your own QR of pairUrl
      img.alt = 'Scan with the ZOREAL ID app';
      panel.append(img);
    }
    const status = document.createElement('p');
    status.textContent = s.status; // pending | claimed | approved | ...
    panel.append(status);
    if (s.cancel) {
      const cancel = document.createElement('button');
      cancel.textContent = 'Cancel';
      cancel.onclick = () => s.cancel!();
      panel.append(cancel);
    }
  };

  button.onclick = async () => {
    handle?.cancel(); // one flow at a time
    handle = startLogin({
      flow: 'auth-code',
      clientId: 'ast_your_asset_id',
      scope: 'openid email profile.name',
      onState: renderPairing,
    });

    try {
      const { code, code_verifier, nonce } = await handle.promise;
      panel.replaceChildren();

      // Post all three to YOUR backend over TLS. Protect this route with your
      // framework's normal CSRF / same-origin controls — the ZOREAL nonce
      // protects the token, not your endpoint. The backend verifies before it
      // trusts, then establishes the session.
      const res = await fetch('/api/auth/zoreal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, code_verifier, nonce }),
      });
      if (!res.ok) throw new Error('backend rejected the login');
      window.location.assign('/dashboard');
    } catch (e) {
      panel.replaceChildren();
      if (e instanceof DOMException && e.name === 'AbortError') {
        return; // the user closed the dialog; say nothing
      }
      if (e instanceof FlowAbandonedError && e.reason.type === 'request_denied') {
        panel.textContent = 'Login declined. Try again when you are ready.';
        return; // a human outcome, not an error to alarm on
      }
      if (e instanceof FlowAbandonedError && e.reason.type === 'request_expired') {
        panel.textContent = 'That took too long. Try again.';
        return;
      }
      if (e instanceof OAuthFlowError) {
        panel.textContent = e.description ?? e.error; // provider's words, verbatim
        return;
      }
      panel.textContent = 'Something went wrong. Try again.';
    }
  };
}
```

For the no-backend case, swap `flow: 'auth-code'` for the default browser-direct
flow: `handle.promise` then resolves `{ credential }`, an ID token carrying only
`sub` and the proof of verification. It **still** has to be verified server-side
against the JWKS before you trust it — a token minted for someone else looks
identical in the browser.

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

## Security

Three things this package leans on, and where each stops:

- **The nonce binds the token to this login — it is not your CSRF token.** This
  package generates a nonce, sends it with the pairing request, and resolves it
  to you alongside the code. Handing it to your backend lets the backend confirm
  the ID token was minted for *this* login rather than substituted. It does
  **not** protect your own login route: guard `/api/auth/zoreal` (or wherever
  you post the code) with your framework's normal CSRF / same-origin defences,
  exactly as you would any endpoint that establishes a session.
- **PKCE is what proves the exchanger started the flow, not the nonce.** This
  package generates the verifier, sends only its S256 challenge to `/pair`, and
  keeps the verifier until the exchange. Whoever completes `/token` must present
  the matching verifier, so an intercepted code alone is useless. PKCE is
  mandatory for every client here — there is no `plain` fallback and never will
  be.
- **The issuer must match the token's `iss` exactly.** It is compared, not
  normalized. Production is `https://id.zoreal.com`, which is the default;
  override `issuer` only when you have been given a specific non-production
  provider URL to point at. Your backend must reject any token whose `iss` is
  not exactly the issuer it expects.

And the rule the whole design rests on: this runs in a browser the threat model
treats as attacker-controlled, so nothing it resolves is trusted until your
backend has verified the ID token's signature, `iss`, `aud`, `exp` and `nonce`
against the JWKS. `unsafeClaims` is named for exactly that reason.

## Verifying this release

Every version is published from GitHub Actions with [npm provenance](https://docs.npmjs.com/generating-provenance-statements): the package page on npmjs.com carries a **Provenance** panel linking the exact commit and workflow run that built the tarball, signed through [Sigstore](https://www.sigstore.dev/) and recorded in its public transparency log. No long-lived npm token stands behind it — the workflow authenticates by OIDC ([trusted publishing](https://docs.npmjs.com/trusted-publishers)), so a leaked CI secret cannot cut a release.

Check the signatures on what you actually installed:

```sh
npm install @zoreal/oauth2-js
npm audit signatures
```

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

## License

MIT.
