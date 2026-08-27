/**
 * The pairing modal, in plain DOM.
 *
 * Same dialog as @zoreal/oauth2-react's, built without a framework so the core
 * package can put the QR on screen by itself. On desktop a QR sign-in cannot
 * complete unless something renders the pairing code, and leaving that to every
 * caller is how a QR login ships with no QR on it.
 *
 * Nothing here is exported as a component: `startLogin` mounts it, updates it
 * from the same state it hands `onState`, and unmounts it when the flow
 * settles. Callers who want their own UI pass `pairingUI: 'none'`.
 */

import { interpolate, isRtl, strings } from './i18n';
import { cx, ensureStyles } from './styles';
import type { PairingState, ZorealTheme } from './types';

/** Our own cap on how long a pairing sits on screen. See `pairingTimeoutMs`. */
export const DEFAULT_PAIRING_TIMEOUT_MS = 120_000;

/** Below this the countdown changes colour: background information becomes a prompt to hurry. */
const URGENT_SECONDS = 20;

function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Icons and the lockup are built with createElementNS rather than innerHTML.
 * This package renders on someone else's sign-in page; assigning markup here
 * would be an injection surface for no benefit.
 */
const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(viewBox: string, attrs: Record<string, string> = {}): SVGSVGElement {
  const node = document.createElementNS(SVG_NS, 'svg');
  node.setAttribute('viewBox', viewBox);
  node.setAttribute('focusable', 'false');
  node.setAttribute('aria-hidden', 'true');
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function path(d: string, attrs: Record<string, string> = {}): SVGPathElement {
  const node = document.createElementNS(SVG_NS, 'path');
  node.setAttribute('d', d);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function strokeIcon(size: number, ds: string[], width = '2'): SVGSVGElement {
  const node = svg('0 0 24 24', {
    width: String(size),
    height: String(size),
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': width,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
  for (const d of ds) node.appendChild(path(d));
  return node;
}

const ZOREAL_BLUE = '#00b4d9';

/** Wordmark paths, from zoreal-web's zoreal-lockup.svg. */
const WORDMARK =
  'M205,40.5h15.3v-3.5h-11.5v-18.4h-3.8v21.8ZM157,22.2v5.6h10.9v3.5h-10.9v5.8h12.5v3.5h-16.3v-21.8h16.2v3.5h-12.4ZM141.4,25.8c0,1.1-.4,2-1.2,2.7-.8.7-1.9,1-3.3,1h-5.6v-7.3h5.6c1.4,0,2.6.3,3.4.9.8.6,1.2,1.5,1.2,2.7ZM146,40.5l-5.9-8.3c.8-.2,1.4-.5,2.1-.9s1.2-.9,1.7-1.4c.4-.5.8-1.2,1.1-1.9s.4-1.5.4-2.4-.1-2-.5-2.9c-.4-.9-.9-1.6-1.7-2.2-.6-.6-1.5-1-2.5-1.4-1-.3-2.2-.4-3.4-.4h-9.8v21.8h3.8v-7.6h4.8l5.4,7.6h4.5ZM115.7,29.7c0,1.1-.1,2.1-.5,3s-.9,1.7-1.5,2.4-1.4,1.2-2.4,1.7c-.9.4-1.9.6-3,.6s-2.1-.1-3-.6-1.7-1-2.4-1.7-1.2-1.5-1.5-2.4-.5-1.9-.5-3,.1-2.1.5-3,.9-1.7,1.5-2.4,1.4-1.2,2.4-1.7c.9-.4,1.9-.6,3-.6s2.1.2,3,.6c.9.4,1.7,1,2.3,1.7.6.6,1.2,1.5,1.6,2.4s.5,1.9.5,3ZM119.7,29.6c0-1.5-.3-3-.8-4.4-.6-1.4-1.4-2.5-2.4-3.6-1-1-2.2-1.8-3.6-2.4-1.4-.6-3-.9-4.6-.9s-3.2.4-4.6.9c-1.4.6-2.7,1.4-3.7,2.4s-1.8,2.2-2.4,3.6c-.5,1.4-.8,2.8-.8,4.4s.3,3,.8,4.4c.6,1.4,1.4,2.5,2.4,3.6,1,1,2.2,1.8,3.6,2.4,1.4.6,3,.9,4.6.9s3.2-.4,4.6-.9c1.4-.6,2.6-1.4,3.7-2.4,1-1,1.8-2.2,2.4-3.6.5-1.4.8-2.9.8-4.4ZM86.1,22.1l-13,15.6v2.8h17.9v-3.4h-12.9l12.9-15.6v-2.8h-17.5v3.4h12.5ZM188.5,18.5h-3.5l-9.6,22h4c3.7-8.8,3.4-8,7.4-17.4,3.7,8.8,3.9,9.1,7.4,17.4h4l-9.6-22Z';

const MARK_PATHS = [
  'M52,25.7c.4-2-.5-4.2-2.5-5.4l-11.8-6.8,3.4-2,10.1,5.9c3.6,2,5.1,6.3,3.8,10.1-.2.5-.4,1-.7,1.6-.3.5-.6.9-1,1.4-.9.9-1.9,1.7-3,2.2-2.4,1-5.2.9-7.6-.5l-5.9-3.4c-1.9-1.1-4.3-.9-5.9.5-.4.4-.8.8-1.1,1.3-.3.5-.5,1.1-.6,1.7-.4,2,.6,4.2,2.5,5.4l11.8,6.8-3.4,2-10.1-5.9c-3.6-2-5.1-6.3-3.8-10.1.1-.5.4-1,.7-1.6.3-.5.7-.9,1-1.4.9-.9,1.9-1.7,3.1-2.2,2.4-1,5.2-.9,7.6.4l5.9,3.4c1.9,1.1,4.3.9,5.9-.5.4-.4.8-.8,1.1-1.3.3-.5.5-1.1.6-1.7Z',
  'M60.3,33.1c-.5.8-1.5,1.1-2.3.6-.9-.5-1.1-1.5-.7-2.3.5-.9,1.5-1.1,2.3-.7.9.5,1.1,1.5.7,2.4Z',
  'M31.9,18c3.4-.5,6.9,0,10,1.9l.8.5h0c.8.5,1,1.5.6,2.3s-1.5,1.1-2.3.6l-.8-.5c-2.8-1.6-6-1.9-8.9-1.2-1,.3-2,.7-3,1.2h0c-.8.5-1.8.2-2.3-.7-.5-.8-.2-1.8.6-2.3,0,0,0,0,.2,0,.2,0,.4-.2.7-.3,1.4-.7,2.9-1.1,4.4-1.4Z',
  'M21.4,24.9c.5-.8,1.6-1,2.3-.5.8.5,1,1.6.5,2.3-.5.8-1.6,1-2.4.5-.8-.5-1-1.6-.5-2.3Z',
  'M45.5,23.9c.5-.9,1.5-1.1,2.3-.7.8.5,1.1,1.5.6,2.4-.5.8-1.5,1.1-2.3.6s-1.1-1.5-.6-2.3Z',
  'M49.4,39.9c-3.3.6-6.9,0-10-1.8l-.8-.5h0c-.8-.5-1.1-1.5-.6-2.3s1.5-1.1,2.3-.6l.8.5c2.8,1.6,6,1.9,9,1.2,1-.3,2-.7,3-1.2h0c.8-.5,1.8-.2,2.3.6.5.9.2,1.9-.6,2.4,0,0-.1,0-.2,0-.2.1-.5.3-.7.4-1.4.7-2.8,1.1-4.4,1.4Z',
  'M35.8,34c-.5.8-1.5,1.1-2.3.6s-1.1-1.5-.6-2.3,1.5-1.1,2.3-.6,1.1,1.5.6,2.3Z',
];

/**
 * The full lockup. The wordmark is `currentColor` rather than the master's
 * near-black, because the dialog renders in either theme and a fixed dark
 * wordmark disappears on a dark card. The mark keeps the brand blue in both:
 * it reads on either ground, and it is the part that says whose sign-in this
 * is.
 */
function lockup(height: number): SVGSVGElement {
  const node = svg('0 0 240 58.5', {
    height: String(height),
    width: String(Math.round(height * (240 / 58.5))),
  });
  node.removeAttribute('aria-hidden');
  node.setAttribute('role', 'img');
  node.setAttribute('aria-label', 'ZOREAL');
  node.appendChild(path(WORDMARK, { fill: 'currentColor' }));
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('fill', ZOREAL_BLUE);
  g.setAttribute('fill-rule', 'evenodd');
  for (const d of MARK_PATHS) g.appendChild(path(d));
  node.appendChild(g);
  return node;
}

export interface PairingModalOptions {
  onCancel: () => void;
  locale?: string;
  theme?: ZorealTheme;
  timeoutMs?: number;
}

export interface PairingModalHandle {
  /** Re-render from a new pairing state. */
  update: (state: PairingState) => void;
  /** Remove the dialog and release everything it held. Idempotent. */
  close: () => void;
}

/**
 * Mounts the dialog and returns the two controls the flow needs. Returns null
 * outside a browser, so importing this package on a server is inert.
 */
export function mountPairingModal(
  state: PairingState,
  options: PairingModalOptions
): PairingModalHandle | null {
  if (typeof document === 'undefined') return null;
  ensureStyles();

  const t = strings(options.locale);
  const timeoutMs = options.timeoutMs ?? DEFAULT_PAIRING_TIMEOUT_MS;
  let closed = false;

  const scrim = el('div', `${cx('root')} ${cx('scrim')}`);
  scrim.dataset.theme = options.theme ?? 'auto';

  const card = el('div', cx('card'));
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.dir = isRtl(options.locale) ? 'rtl' : 'ltr';

  const titleId = `zrl-title-${Math.random().toString(36).slice(2, 9)}`;
  card.setAttribute('aria-labelledby', titleId);

  const closeBtn = el('button', cx('close'));
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', t.close);
  closeBtn.appendChild(strokeIcon(16, ['M18 6 6 18M6 6l12 12']));

  const body = el('div', cx('body'));
  const mark = lockup(44);
  mark.classList.add(cx('lockup'));

  const title = el('h2', cx('title'));
  title.id = titleId;
  const bodyText = el('p', cx('body-text'));

  const well = el('div', cx('qr-well'));
  const qr = el('img', cx('qr'));
  qr.alt = t.qrAlt;
  qr.width = 180;
  qr.height = 180;
  if (state.qrUrl) qr.src = state.qrUrl;

  const overlay = el('span', cx('qr-overlay'));
  const badge = el('span', cx('qr-badge'));
  badge.appendChild(strokeIcon(24, ['M8.5 2h7a2.5 2.5 0 0 1 2.5 2.5v15a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 6 19.5v-15A2.5 2.5 0 0 1 8.5 2Z', 'M11 18.5h2'], '1.8'));
  overlay.appendChild(badge);
  well.append(qr, overlay);

  const status = el('div', cx('status'));
  const dot = el('span', cx('dot'));
  dot.append(el('i'), el('i'));
  const statusLabel = el('span');
  status.append(dot, statusLabel);

  const timer = el('p', cx('timer'));

  body.append(mark, title, bodyText, well, status, timer);

  // The QR is on screen because this person is being asked to use a phone app,
  // and some of them do not have it yet. Without this the panel reads as "scan
  // this with something I do not have", and the flow dead-ends at the one
  // moment it can still be recovered: the same code installs the app.
  const help = el('div', cx('help'));
  help.append(el('p', cx('help-title'), t.noIdTitle), el('p', cx('help-body'), t.noIdBody));

  const footer = el('div', cx('footer'));
  const cancelBtn = el('button', cx('cancel'), t.cancel);
  cancelBtn.type = 'button';
  const secured = el('p', cx('secured'));
  secured.append(strokeIcon(13, ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'm9 12 2 2 4-4']), document.createTextNode(t.secured));
  footer.append(cancelBtn, secured);

  card.append(closeBtn, body, help, footer);
  scrim.appendChild(card);

  // A deadline, not a decremented counter: background tabs throttle timers, so
  // a counter that subtracts one per tick comes back lying about the time left.
  const serverMs = typeof state.expiresIn === 'number' ? state.expiresIn * 1000 : Infinity;
  const deadline = Date.now() + Math.min(timeoutMs, serverMs);

  const paint = (s: PairingState) => {
    // `claimed` = the request is waiting in the holder's app; `enrolling` = a
    // first-time holder finishing setup. In both the QR is spent and the action
    // has moved to the phone.
    const settled = s.status === 'claimed' || s.status === 'enrolling';
    title.textContent = settled ? t.titleApprove : t.title;
    bodyText.textContent =
      s.status === 'enrolling' ? t.bodyEnrolling : settled ? t.bodyApprove : t.bodyScan;
    statusLabel.textContent = settled ? t.waitingApproval : t.waiting;
    qr.dataset.spent = String(settled);
    overlay.style.display = settled ? '' : 'none';
    if (s.qrUrl && qr.src !== s.qrUrl) qr.src = s.qrUrl;
  };

  const tick = () => {
    const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    timer.textContent = interpolate(t.expiresIn, mmss(left));
    timer.dataset.urgent = String(left <= URGENT_SECONDS);
    if (left === 0) {
      // Stop the tick before cancelling: close() clears it too, but a timer
      // still firing cancel once a second in between is a race to inherit.
      window.clearInterval(interval);
      options.onCancel();
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') options.onCancel();
  };

  const close = () => {
    if (closed) return;
    closed = true;
    window.clearInterval(interval);
    document.removeEventListener('keydown', onKey);
    document.body.style.overflow = previousOverflow;
    scrim.remove();
  };

  // Every dismissal is the same behaviour: abort the poll, close. An orphaned
  // poll is how a request gets cancelled for over-polling.
  closeBtn.addEventListener('click', options.onCancel);
  cancelBtn.addEventListener('click', options.onCancel);
  scrim.addEventListener('click', (e) => {
    if (e.target === scrim) options.onCancel();
  });
  document.addEventListener('keydown', onKey);

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  paint(state);
  tick();
  const interval = window.setInterval(tick, 1000);

  document.body.appendChild(scrim);
  closeBtn.focus();

  return { update: paint, close };
}
