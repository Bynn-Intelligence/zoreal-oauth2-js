import type { PairingStrings } from './i18n';
import type { LoginIntent } from './types';

/**
 * The scopes a relying party asks for in order to know who is signing in:
 * the identifier, and how to reach and address the person. Anything beyond
 * these is an attribute read from the identity document, and the dialog
 * should say that it is about to be shared rather than call it a sign-in.
 */
const SIGN_IN_SCOPES = new Set(['openid', 'email', 'profile.name']);

/**
 * What the pairing dialog says it is for. An explicit intent wins. Otherwise
 * a request for document attributes is an identification; a request for the
 * identifier alone with a liveness capture is a presence check, since nothing
 * is being logged into; everything else is a sign-in.
 */
export function resolveIntent(
  intent: LoginIntent | undefined,
  scope: string | undefined,
  acrValues: string | readonly string[] | undefined
): LoginIntent {
  if (intent) return intent;
  const scopes = (scope ?? 'openid').split(/\s+/).filter(Boolean);
  if (scopes.some((s) => !SIGN_IN_SCOPES.has(s))) return 'identify';
  const acr = typeof acrValues === 'string' ? acrValues.split(/\s+/) : (acrValues ?? []);
  if (scopes.every((s) => s === 'openid') && acr.includes('zoreal.live')) return 'presence';
  return 'sign-in';
}

/** The unscanned-code title for an intent. */
export function titleFor(t: PairingStrings, intent: LoginIntent): string {
  if (intent === 'identify') return t.titleIdentify;
  if (intent === 'presence') return t.titlePresence;
  return t.title;
}
