/**
 * The way back for the same-device sign-in.
 *
 * The tap navigates away to the provider, the app opens, and once the holder
 * has approved, the app opens this page again with the pairing named in the
 * URL fragment. The page then has to finish a sign-in it did not start in
 * this page load, so the flow is saved here before the navigation and taken
 * back on the return: the verifier, the nonce, the state and which mode the
 * caller wanted. Local storage rather than session storage because the
 * browser opens the return in a new tab, and session storage is per tab.
 *
 * The original tab may still be polling when the returned page completes.
 * Whichever finishes first marks the flow done; the other, on seeing the
 * approval, stands down instead of spending a code that was already used.
 */

export interface SavedFlow {
  v: 1;
  issuer: string;
  clientId: string;
  flow: 'browser-direct' | 'auth-code';
  verifier: string;
  nonce: string;
  state: string;
  scope: string;
  appState?: string;
  requestId: string;
  createdAt: number;
}

const PREFIX = 'zoreal:oauth2:return:';
const DONE = 'zoreal:oauth2:done:';
/** A saved flow older than this is not resumed; the pairing is long expired. */
const MAX_AGE_MS = 10 * 60 * 1000;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function saveReturnFlow(flow: SavedFlow): void {
  try {
    storage()?.setItem(PREFIX + flow.requestId, JSON.stringify(flow));
  } catch {
    // Storage full or blocked: the original tab still polls and completes.
  }
}

/**
 * The saved flow for a pairing, left in place; null when none, or too old.
 * Left in place because the first reader on a page may not be its owner: a
 * page can carry more than one client, and only the one whose id matches
 * takes it (`forgetReturnFlow`).
 */
export function peekReturnFlow(requestId: string): SavedFlow | null {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(PREFIX + requestId);
  if (!raw) return null;
  try {
    const flow = JSON.parse(raw) as SavedFlow;
    if (flow.v !== 1 || flow.requestId !== requestId) return null;
    if (Date.now() - flow.createdAt > MAX_AGE_MS) return null;
    return flow;
  } catch {
    return null;
  }
}

/** The owner has taken the flow up; nobody else on this page load should. */
export function forgetReturnFlow(requestId: string): void {
  try {
    storage()?.removeItem(PREFIX + requestId);
  } catch {
    // Nothing to do.
  }
  if (pending === requestId) pending = null;
}

export function markReturnDone(requestId: string): void {
  try {
    const store = storage();
    store?.setItem(DONE + requestId, String(Date.now()));
    store?.removeItem(PREFIX + requestId);
  } catch {
    // Nothing to do: at worst the other tab attempts a used code and is told so.
  }
}

export function isReturnDone(requestId: string): boolean {
  return storage()?.getItem(DONE + requestId) !== null && storage()?.getItem(DONE + requestId) !== undefined;
}

/** The address the app reopens: this page, without any fragment. */
export function returnToUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const { href } = window.location;
  const hash = href.indexOf('#');
  return hash === -1 ? href : href.slice(0, hash);
}

const RETURN_MARK = /(?:^|[#&])zoreal_return=([A-Za-z0-9]{32})(?:&|$)/;

/** The id read from the fragment, held for the rest of this page load. */
let pending: string | null = null;

/**
 * The pairing named in this page's fragment by the app's return, if any. The
 * fragment is removed from the address bar as it is read, so a reload does
 * not try to resume a second time, and the id is kept for this page load so
 * every reader on the page sees it until its owner takes the flow up.
 */
export function pendingReturnId(): string | null {
  if (pending) return pending;
  if (typeof window === 'undefined') return null;
  const match = RETURN_MARK.exec(window.location.hash);
  if (!match) return null;
  pending = match[1];
  try {
    window.history.replaceState(window.history.state, '', returnToUrl());
  } catch {
    // Some embedded browsers refuse; the id was still read.
  }
  return pending;
}
