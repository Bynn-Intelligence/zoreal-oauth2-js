/**
 * The pairing modal's stylesheet, injected once on first mount.
 *
 * Why a stylesheet and not inline styles: the modal needs hover, focus-visible,
 * keyframes, `prefers-color-scheme` and `prefers-reduced-motion`. None of those
 * exist as inline style properties, and a component that silently drops its
 * focus ring and its reduced-motion fallback is not shippable in a sign-in
 * flow.
 *
 * Why injected and not a `.css` file the integrator imports: a required import
 * step is a required support ticket. Plenty of hosts (Next.js app dir, CRA,
 * plain Vite, an app with no CSS pipeline at all) treat package CSS
 * differently, and the modal has to look the same in all of them.
 *
 * Every selector is prefixed `zrl-` and every declaration is scoped under one
 * of those classes, so nothing here can reach the host's markup. Values are
 * literal rather than inherited for the same reason: a host page with an
 * aggressive reset must not be able to break the layout of a dialog the person
 * is being asked to authenticate in. Font family is the one exception — it
 * inherits the host's UI font so the modal belongs to the page it opens on.
 */

const PREFIX = 'zrl';
export const cx = (name: string) => `${PREFIX}-${name}`;

export const STYLE_ELEMENT_ID = 'zoreal-pairing-styles';

/**
 * Palette. `light`/`dark` force a theme, `auto` follows the OS. The tokens are
 * defined three times rather than once with overrides so a forced theme never
 * depends on media-query specificity to win.
 */
const LIGHT = `
  --zrl-scrim: rgba(16, 18, 27, 0.45);
  --zrl-surface: #ffffff;
  --zrl-surface-sunken: #f6f7f9;
  --zrl-ink: #16181c;
  --zrl-ink-soft: #4a4f57;
  --zrl-ink-mute: #6b7078;
  --zrl-line: #e4e6ea;
  --zrl-line-soft: #eef0f3;
  --zrl-accent: #00b4d9;
  --zrl-accent-soft: #dcf3fa;
  --zrl-accent-ink: #04698a;
  --zrl-urgent: #b4761a;
  --zrl-qr-bg: #ffffff;
  --zrl-shadow: 0 1px 2px rgba(16, 18, 27, 0.06), 0 20px 50px -12px rgba(16, 18, 27, 0.3);
  --zrl-ring: rgba(16, 18, 27, 0.07);
`;

const DARK = `
  --zrl-scrim: rgba(0, 0, 0, 0.62);
  --zrl-surface: #17191d;
  --zrl-surface-sunken: #1f2226;
  --zrl-ink: #f4f5f7;
  --zrl-ink-soft: #b3b8c0;
  --zrl-ink-mute: #8b9199;
  --zrl-line: #2c3036;
  --zrl-line-soft: #24272c;
  --zrl-accent: #34c9e8;
  --zrl-accent-soft: #0d3b47;
  --zrl-accent-ink: #7fdcf0;
  --zrl-urgent: #e0a952;
  /* The QR well stays white in dark mode on purpose: a scanner needs the
     quiet-zone contrast, and an inverted QR fails on a good number of phone
     cameras. It reads as a deliberate light panel, not a theming miss. */
  --zrl-qr-bg: #ffffff;
  --zrl-shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 20px 50px -12px rgba(0, 0, 0, 0.65);
  --zrl-ring: rgba(255, 255, 255, 0.1);
`;

export const CSS = `
.${PREFIX}-root { ${LIGHT} }
.${PREFIX}-root[data-theme="dark"] { ${DARK} }
@media (prefers-color-scheme: dark) {
  .${PREFIX}-root[data-theme="auto"] { ${DARK} }
}

.${PREFIX}-scrim {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 16px;
  background: var(--zrl-scrim);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  font-family: inherit;
  animation: ${PREFIX}-fade 200ms ease-out both;
}

.${PREFIX}-card {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 380px;
  border-radius: 16px;
  background: var(--zrl-surface);
  color: var(--zrl-ink);
  box-shadow: var(--zrl-shadow);
  outline: 1px solid var(--zrl-ring);
  outline-offset: -1px;
  text-align: center;
  animation: ${PREFIX}-rise 300ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

.${PREFIX}-body { padding: 28px 24px 20px; }

.${PREFIX}-lockup { display: block; margin: 0 auto; color: var(--zrl-ink); }

.${PREFIX}-title {
  margin: 18px 0 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--zrl-ink);
}

.${PREFIX}-body-text {
  margin: 6px auto 0;
  max-width: 30ch;
  font-size: 14px;
  line-height: 1.55;
  color: var(--zrl-ink-soft);
}

.${PREFIX}-qr-well {
  position: relative;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: 204px;
  height: 204px;
  margin: 20px auto 0;
  padding: 12px;
  border: 1px solid var(--zrl-line);
  border-radius: 16px;
  background: var(--zrl-qr-bg);
}

.${PREFIX}-qr {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  transition: filter 300ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 300ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 300ms cubic-bezier(0.23, 1, 0.32, 1);
}

/* Once the code is claimed the QR is spent. Blurring it out rather than
   swapping it keeps one object on screen through the state change, so the eye
   reads a transformation instead of two things trading places. */
.${PREFIX}-qr[data-spent="true"] { opacity: 0.2; filter: blur(3px); transform: scale(0.96); }

.${PREFIX}-qr-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  animation: ${PREFIX}-fade 200ms ease-out both;
}

.${PREFIX}-qr-badge {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: var(--zrl-accent-soft);
  color: var(--zrl-accent-ink);
}

.${PREFIX}-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--zrl-ink);
}

.${PREFIX}-dot { position: relative; display: grid; place-items: center; width: 8px; height: 8px; }
.${PREFIX}-dot i {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--zrl-accent);
  font-style: normal;
}
.${PREFIX}-dot i:first-child { animation: ${PREFIX}-ping 1.8s cubic-bezier(0.23, 1, 0.32, 1) infinite; }

.${PREFIX}-timer {
  margin: 4px 0 0;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--zrl-ink-mute);
  transition: color 200ms ease-out;
}
.${PREFIX}-timer[data-urgent="true"] { color: var(--zrl-urgent); }

.${PREFIX}-help {
  padding: 14px 24px;
  border-top: 1px solid var(--zrl-line-soft);
  background: var(--zrl-surface-sunken);
  border-radius: 0;
}
.${PREFIX}-help-title { margin: 0; font-size: 12px; font-weight: 600; color: var(--zrl-ink); }
.${PREFIX}-help-body {
  margin: 4px auto 0;
  max-width: 34ch;
  font-size: 12px;
  line-height: 1.55;
  color: var(--zrl-ink-soft);
}

.${PREFIX}-footer { padding: 12px; border-top: 1px solid var(--zrl-line-soft); }

.${PREFIX}-cancel {
  display: block;
  width: 100%;
  padding: 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--zrl-ink-soft);
  cursor: pointer;
  transition: background-color 150ms ease-out, color 150ms ease-out, transform 150ms ease-out;
}
.${PREFIX}-cancel:hover { background: var(--zrl-surface-sunken); color: var(--zrl-ink); }
.${PREFIX}-cancel:active { transform: scale(0.99); }

.${PREFIX}-secured {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--zrl-ink-mute);
}

.${PREFIX}-close {
  position: absolute;
  top: 12px;
  inset-inline-end: 12px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--zrl-ink-mute);
  cursor: pointer;
  transition: background-color 150ms ease-out, color 150ms ease-out, transform 150ms ease-out;
}
.${PREFIX}-close:hover { background: var(--zrl-surface-sunken); color: var(--zrl-ink); }
.${PREFIX}-close:active { transform: scale(0.95); }

.${PREFIX}-card :focus-visible {
  outline: 2px solid var(--zrl-accent);
  outline-offset: 2px;
}

@keyframes ${PREFIX}-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ${PREFIX}-rise {
  from { opacity: 0; transform: translateY(10px) scale(0.98) }
  to { opacity: 1; transform: none }
}
@keyframes ${PREFIX}-ping {
  0% { transform: scale(1); opacity: 0.5 }
  70%, 100% { transform: scale(2.6); opacity: 0 }
}

@media (prefers-reduced-motion: reduce) {
  .${PREFIX}-scrim,
  .${PREFIX}-card,
  .${PREFIX}-qr-overlay { animation: none }
  .${PREFIX}-dot i:first-child { animation: none; opacity: 0.35 }
  .${PREFIX}-qr,
  .${PREFIX}-cancel,
  .${PREFIX}-close,
  .${PREFIX}-timer { transition: none }
}
`;

/**
 * Injected at module scope on first import in a DOM, not per render: the tag is
 * idempotent by id, so a host with two provider instances (or a hot reload)
 * still ends up with exactly one.
 */
export function ensureStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ELEMENT_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ELEMENT_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}
