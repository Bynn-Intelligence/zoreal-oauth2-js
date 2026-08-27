/**
 * Reads claims OUT of an ID token without verifying it.
 *
 * That is not a shortcut, it is the design: this code runs in a browser the
 * threat model assumes is attacker-controlled, so a signature check here
 * proves nothing to anyone. The token is verified where verification means
 * something: server-side against the JWKS. What this parser feeds is
 * convenience fields (acr on the response object) that the types document as
 * convenience, with the token staying the authority.
 */

export function unsafeClaims(idToken: string): Record<string, unknown> {
  try {
    const payload = idToken.split('.')[1] ?? '';
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(
      new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)))
    );
  } catch {
    return {};
  }
}
