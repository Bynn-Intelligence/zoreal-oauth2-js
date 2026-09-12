import { cx, ensureStyles } from './styles';

/**
 * Holds a site's own sign-in control busy while a login runs, with the
 * pairing modal's light round it, and lets it go when the login ends.
 *
 * The control is whatever the person tapped: the React hook takes it from
 * the click event handed to `login`, and `startLogin` takes it as `control`.
 * Nothing is asked of the site: no wrapper round its button, no busy state
 * of its own, no CSS. The light is an overlay in the document body, placed
 * over the control's box and kept there through scrolling and resizing, so
 * neither an ancestor's overflow nor a selector that counts on the button's
 * parent is affected. The control is disabled for the duration, and whatever
 * `disabled` and `aria-busy` it had before are put back.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const TAIL = 0.3;
const STACK = Array.from({ length: 12 }, (_, i) => 12 - i);
const HALO = [3, 2, 1];

/**
 * The control's corner as the two radii an SVG rect takes, for a box of the
 * given size. A pill's CSS radius is "9999px", or from Tailwind v4 a float
 * near infinity, and an SVG rect clamps rx to half its width and ry to half
 * its height SEPARATELY: copying such a value into both turned a pill into an
 * ellipse, with the light bulging past the button's straight edges. The clamp
 * to the shorter half-side happens here instead, once the box is known. A
 * percentage radius is a percentage of each side in CSS too, so it is honoured
 * per axis. The 2px is the ring's offset outside the box (styles.ts), kept so
 * the corners stay concentric with the control's.
 */
export function cornerOf(radius: string, width: number, height: number): [number, number] {
  const raw = radius.trim();
  const value = parseFloat(raw);
  const offset = 2;
  if (raw.endsWith('%') && Number.isFinite(value)) {
    return [(width * value) / 100 + offset, (height * value) / 100 + offset];
  }
  const px = Number.isFinite(value) ? value : /infinity/i.test(raw) ? Infinity : 8;
  const r = Math.min(px, width / 2, height / 2) + offset;
  return [r, r];
}

export function holdBusy(control: HTMLElement): () => void {
  if (typeof document === 'undefined') return () => {};
  ensureStyles();

  const hadDisabled = control.hasAttribute('disabled');
  const hadBusy = control.getAttribute('aria-busy');
  if (control instanceof HTMLButtonElement || control instanceof HTMLInputElement) {
    control.disabled = true;
  } else {
    control.setAttribute('aria-disabled', 'true');
  }
  control.setAttribute('aria-busy', 'true');

  const overlay = document.createElement('div');
  overlay.className = `${cx('root')} ${cx('ring')} ${cx('ring-overlay')}`;
  overlay.dataset.theme = 'auto';
  overlay.dataset.busy = 'true';
  overlay.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', cx('ring-svg'));
  const rects: SVGRectElement[] = [];
  const layer = (name: string, len: number, alpha: string) => {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('class', cx(name));
    rects.push(rect);
    rect.style.strokeDasharray = `calc(var(--zrl-l) * ${len}) calc(var(--zrl-l) * ${1 - len})`;
    rect.style.setProperty('--zrl-s', `calc(var(--zrl-l) * ${-(TAIL - len)})`);
    rect.style.opacity = alpha;
    svg.appendChild(rect);
    return rect;
  };
  let measured: SVGRectElement | null = null;
  for (const n of HALO) {
    const rect = layer('ring-halo', (TAIL * n) / HALO.length, `calc(var(--zrl-glow-opacity) * 0.6 / ${n})`);
    measured ??= rect;
  }
  for (const n of STACK) layer(n <= 2 ? 'ring-head' : 'ring-tail', (TAIL * n) / STACK.length, String(1 / n));
  overlay.appendChild(svg);
  document.body.appendChild(overlay);

  // The overlay follows the control's box. Fixed positioning against the
  // viewport rect, re-read on every frame the page may have moved it.
  let frame = 0;
  const place = () => {
    frame = 0;
    const box = control.getBoundingClientRect();
    overlay.style.left = `${box.left}px`;
    overlay.style.top = `${box.top}px`;
    overlay.style.width = `${box.width}px`;
    overlay.style.height = `${box.height}px`;
    const [rx, ry] = cornerOf(getComputedStyle(control).borderTopLeftRadius, box.width, box.height);
    for (const rect of rects) {
      rect.setAttribute('rx', String(rx));
      rect.setAttribute('ry', String(ry));
    }
    const length = typeof measured?.getTotalLength === 'function' ? measured.getTotalLength() : 0;
    if (length > 0) overlay.style.setProperty('--zrl-ring-len', `${length}px`);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(place);
  };
  place();
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  observer?.observe(control);
  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (frame) cancelAnimationFrame(frame);
    observer?.disconnect();
    window.removeEventListener('scroll', schedule, true);
    window.removeEventListener('resize', schedule);
    overlay.remove();
    if (control instanceof HTMLButtonElement || control instanceof HTMLInputElement) {
      control.disabled = hadDisabled;
    } else {
      control.removeAttribute('aria-disabled');
    }
    if (hadBusy === null) control.removeAttribute('aria-busy');
    else control.setAttribute('aria-busy', hadBusy);
  };
}

/** The element a click event was bound to, if it is one this can hold. */
export function controlFrom(event: unknown): HTMLElement | null {
  const target = (event as { currentTarget?: unknown } | null)?.currentTarget;
  return typeof HTMLElement !== 'undefined' && target instanceof HTMLElement ? target : null;
}
