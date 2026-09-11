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
  --zrl-qr-filter: none;
  --zrl-qr-spent-filter: blur(3px);
  --zrl-qr-blend: normal;
  --zrl-shadow: 0 1px 2px rgba(16, 18, 27, 0.06), 0 20px 50px -12px rgba(16, 18, 27, 0.3);
  --zrl-ring: rgba(16, 18, 27, 0.07);
  /* The light on the QR well's edge. Brand blue on both grounds, a lighter
     tint at the head; only its strength is themed, see the dark block. */
  --zrl-beam: #00b4d9;
  --zrl-beam-head: #7fe0f4;
  --zrl-beam-line: 2px;
  --zrl-glow-core: 4px;
  --zrl-glow-reach: 24px;
  --zrl-glow-blur: 8px;
  --zrl-glow-opacity: 0.6;
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
  /* The code is drawn light on the dark surface: the panel is transparent
     and the image is inverted and screened, so only the modules and the
     mark show. */
  --zrl-qr-bg: transparent;
  --zrl-qr-filter: invert(1);
  --zrl-qr-spent-filter: invert(1) blur(3px);
  --zrl-qr-blend: screen;
  --zrl-shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 20px 50px -12px rgba(0, 0, 0, 0.65);
  --zrl-ring: rgba(255, 255, 255, 0.1);
  /* A glow that reads on a white card disappears on a dark one: the light
     here is brighter and wider, and its halo reaches further out. */
  --zrl-beam: #22c8ec;
  --zrl-beam-head: #c2f3fc;
  --zrl-beam-line: 3px;
  --zrl-glow-core: 6px;
  --zrl-glow-reach: 32px;
  --zrl-glow-blur: 10px;
  --zrl-glow-opacity: 0.85;
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
  border-radius: var(--zrl-radius);
  background: var(--zrl-qr-bg);
  /* The light on the edge takes its shape from here and its colour and
     strength from the theme tokens above. One lap in 4s on every tier. */
  --zrl-radius: 16px;
  --zrl-beam-time: 4s;
}

/* The light on the well's edge: a short comet running along the border, with
   a soft glow outside it. Three overlays inside the well, each masked so the
   comet can only ever paint where its mask allows, and the white interior lies
   outside every mask: nothing here can reach the quiet zone a camera needs,
   whatever the comet is doing. The mask is the padding box cut out of the
   border box, a transparent layer clipped to the padding box intersected
   with a solid one clipped to the border box. The prefixed form is for Chrome
   before 120 and Safari before 15.4; the unprefixed one, declared after it,
   wins everywhere else.

   qr-beam keeps a thin ring on the border line: the comet itself.
   qr-beam-glow is the glow: a wide band outside the well that blurs whatever
   is inside it, and inside it qr-beam-glow-band keeps a 3px ring with a
   second copy of the comet. The blur has to sit on the parent because a
   filter is applied before a mask: blurred on the band itself, the glow
   would be cut back to the band's own edge. On the parent it runs after the
   band has clipped the comet thin and before the parent's mask cuts away the
   inward half, which is what makes it fade outward and never over the QR.
   All three share one containing block, the well's padding box, so the two
   comets ride the same path; the spent badge is a later sibling and paints
   above them. */
.${PREFIX}-qr-beam,
.${PREFIX}-qr-beam-glow,
.${PREFIX}-qr-beam-glow-band {
  position: absolute;
  inset: calc(0px - var(--zrl-beam-line));
  border: var(--zrl-beam-line) solid transparent;
  border-radius: calc(var(--zrl-radius) - 1px + var(--zrl-beam-line));
  pointer-events: none;
  -webkit-mask: linear-gradient(transparent, transparent), linear-gradient(#fff, #fff);
  -webkit-mask-clip: padding-box, border-box;
  -webkit-mask-composite: source-in;
  mask: linear-gradient(transparent, transparent), linear-gradient(#fff, #fff);
  mask-clip: padding-box, border-box;
  mask-composite: intersect;
}
.${PREFIX}-qr-beam-glow {
  inset: calc(0px - var(--zrl-glow-reach));
  border-width: var(--zrl-glow-reach);
  border-radius: calc(var(--zrl-radius) - 1px + var(--zrl-glow-reach));
  filter: blur(var(--zrl-glow-blur));
  opacity: var(--zrl-glow-opacity);
  will-change: filter;
}
.${PREFIX}-qr-beam-glow-band {
  inset: calc(0px - var(--zrl-glow-core));
  border-width: var(--zrl-glow-core);
  border-radius: calc(var(--zrl-radius) - 1px + var(--zrl-glow-core));
}

/* At rest the edge holds a dim, even blue: a 1px line on the border and, from
   the glow band, a soft halo outside it. Hidden while the comet runs, so the
   border reads as the well's own line with a light passing over it; shown
   once the light has stopped. Every path below ends here, which is what
   makes them look the same at rest. */
.${PREFIX}-qr-beam::before,
.${PREFIX}-qr-beam-glow-band::before {
  content: '';
  position: absolute;
  inset: -50%;
  background: var(--zrl-beam);
  opacity: 0;
  transition: opacity 400ms cubic-bezier(0.23, 1, 0.32, 1);
}

/* The moving light: an oversized square carrying a conic sweep, rotated
   whole. A transform animation runs on the compositor, so the light keeps
   moving while the page is busy; animating the gradient angle instead
   repaints every frame on the main thread and stutters. */
.${PREFIX}-qr-beam::after,
.${PREFIX}-qr-beam-glow-band::after {
  content: '';
  position: absolute;
  inset: -50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg 220deg,
    var(--zrl-beam) 330deg,
    var(--zrl-beam-head) 348deg,
    transparent 356deg 360deg
  );
  animation: ${PREFIX}-orbit var(--zrl-beam-time) linear infinite;
  will-change: transform;
  transition: opacity 400ms cubic-bezier(0.23, 1, 0.32, 1);
}

/* Spent: the light stops where it is and fades, and the edge settles to the
   dim glow. Paused rather than removed, so it does not jump back to its start
   on the way out. */
.${PREFIX}-qr-well[data-spent="true"] .${PREFIX}-qr-beam::after,
.${PREFIX}-qr-well[data-spent="true"] .${PREFIX}-qr-beam-glow-band::after {
  animation-play-state: paused;
  opacity: 0;
}
.${PREFIX}-qr-well[data-spent="true"] .${PREFIX}-qr-beam::before { opacity: 0.55; }
.${PREFIX}-qr-well[data-spent="true"] .${PREFIX}-qr-beam-glow-band::before { opacity: 0.7; }

.${PREFIX}-qr {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  filter: var(--zrl-qr-filter);
  mix-blend-mode: var(--zrl-qr-blend);
  transition: filter 300ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 300ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 300ms cubic-bezier(0.23, 1, 0.32, 1);
}

/* Once the code is claimed the QR is spent. Blurring it out rather than
   swapping it keeps one object on screen through the state change, so the eye
   reads a transformation instead of two things trading places. */
.${PREFIX}-qr[data-spent="true"] { opacity: 0.2; filter: var(--zrl-qr-spent-filter); transform: scale(0.96); }

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
  text-decoration: none;
  border-radius: 6px;
  transition: color 150ms ease-out;
}
.${PREFIX}-secured:hover { color: var(--zrl-ink); }

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

@keyframes ${PREFIX}-orbit { to { transform: rotate(360deg) } }
/* THE BUSY RING. The light of the QR well, around any control that is
   waiting on the provider: the button on a phone between the tap and the
   hand-over to the app. The well's sweep is a cone from the centre, which is
   even on a square and useless on a wide button: it crawls along the long
   sides and lights two edges at once near the ends. So here the light is a
   dash on an SVG outline, which moves at one speed the whole way round
   whatever the shape, drawn with the well's tokens: its colour and head
   tint, its line width, its halo, its four second lap. The outline's length
   is measured by the component and set as --zrl-ring-len, and every dash
   and offset is a fraction of it, because pathLength does not scale dash
   values given from CSS. A stroke cannot fade along its length, so the tail
   is a stack of dashes sharing one head, each shorter and more opaque than
   the one under it, with opacities chosen so the stack composes to a
   straight fade from the head to nothing three tenths of the way back; the
   component sets each layer's length, offset and opacity. Shown only while
   busy. */
.${PREFIX}-ring {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
  --zrl-beam-time: 4s;
}
.${PREFIX}-ring-svg {
  position: absolute;
  inset: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  overflow: visible;
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms ease-out;
}
.${PREFIX}-ring[data-busy="true"] > .${PREFIX}-ring-svg { opacity: 1; }
/* The same light as an overlay in the document body, placed over a site's
   own control by the package itself (busy.ts): nothing of the site's
   markup or CSS is touched, and neither an ancestor's overflow nor a
   selector on the control's parent is affected. */
.${PREFIX}-ring-overlay {
  position: fixed;
  display: block;
  z-index: 2147483000;
  pointer-events: none;
}
.${PREFIX}-ring-svg rect {
  --zrl-l: var(--zrl-ring-len, 600px);
  x: 2px;
  y: 2px;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  fill: none;
  stroke: var(--zrl-beam);
  stroke-width: var(--zrl-beam-line);
  stroke-linecap: round;
  stroke-dashoffset: var(--zrl-s, 0px);
  animation: ${PREFIX}-dash var(--zrl-beam-time) linear infinite;
}
.${PREFIX}-ring-head { stroke: var(--zrl-beam-head); }
.${PREFIX}-ring-halo {
  stroke-width: calc(var(--zrl-glow-core) * 2 + var(--zrl-beam-line));
  filter: blur(var(--zrl-glow-blur));
}
@keyframes ${PREFIX}-dash {
  from { stroke-dashoffset: var(--zrl-s, 0px); }
  to { stroke-dashoffset: calc(var(--zrl-s, 0px) - var(--zrl-l)); }
}
@media (prefers-reduced-motion: reduce) {
  .${PREFIX}-ring-svg rect { animation: none; stroke-dasharray: none; opacity: 0.45; }
  .${PREFIX}-ring-halo, .${PREFIX}-ring-head { display: none; }
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
  /* No travelling light; the edge keeps its dim static glow instead. */
  .${PREFIX}-qr-beam::after,
  .${PREFIX}-qr-beam-glow-band::after { animation: none; opacity: 0 }
  .${PREFIX}-qr-beam::before { opacity: 0.55 }
  .${PREFIX}-qr-beam-glow-band::before { opacity: 0.7 }
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
