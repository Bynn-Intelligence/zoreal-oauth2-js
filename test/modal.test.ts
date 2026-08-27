// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountPairingModal } from '../src/modal';
import { strings } from '../src/i18n';
import type { PairingState } from '../src/types';

const pending: PairingState = {
  status: 'pending',
  expiresIn: 120,
  pairUrl: 'https://id.zoreal.com/pair/abc',
  qrUrl: 'https://id.zoreal.com/pair/abc/qr.svg',
};

const mount = (state: PairingState = pending, opts: Record<string, unknown> = {}) => {
  const onCancel = vi.fn();
  const handle = mountPairingModal(state, { onCancel, ...opts });
  return { handle: handle!, onCancel };
};

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  vi.useRealTimers();
});

describe('mountPairingModal', () => {
  it('puts a labelled dialog on the page with the QR in it', () => {
    const { handle } = mount();
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    // aria-labelledby must point at an element that exists, or the label is a lie.
    const labelledBy = dialog.getAttribute('aria-labelledby')!;
    expect(document.getElementById(labelledBy)?.textContent).toBe(strings('en').title);

    const img = document.querySelector('img')!;
    expect(img.getAttribute('src')).toBe(pending.qrUrl);
    expect(img.getAttribute('alt')).toBe(strings('en').qrAlt);
    handle.close();
  });

  it('locks page scroll while open and restores it on close', () => {
    document.body.style.overflow = 'scroll';
    const { handle } = mount();
    expect(document.body.style.overflow).toBe('hidden');
    handle.close();
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('swaps to the approve wording once the code is claimed', () => {
    const { handle } = mount();
    const en = strings('en');
    expect(document.body.textContent).toContain(en.waiting);

    handle.update({ ...pending, status: 'claimed' });
    expect(document.body.textContent).toContain(en.titleApprove);
    expect(document.body.textContent).toContain(en.waitingApproval);
    // The spent QR is marked so the stylesheet can blur it out.
    expect(document.querySelector('img')!.dataset.spent).toBe('true');
    handle.close();
  });

  it('renders the enrolling state as its own message', () => {
    const { handle } = mount();
    handle.update({ ...pending, status: 'enrolling' });
    expect(document.body.textContent).toContain(strings('en').bodyEnrolling);
    handle.close();
  });

  // Every dismissal is the same behaviour: abort the poll, close.
  it('cancels from the Cancel button, the X and Escape alike', () => {
    for (const dismiss of [
      () => document.querySelectorAll('button')[1].click(), // Cancel
      () => document.querySelectorAll('button')[0].click(), // X
      () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' })),
    ]) {
      const { handle, onCancel } = mount();
      dismiss();
      expect(onCancel).toHaveBeenCalledTimes(1);
      handle.close();
    }
  });

  it('cancels on a backdrop click but not on a click inside the card', () => {
    const { handle, onCancel } = mount();
    document.querySelector('[role="dialog"]')!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    expect(onCancel).not.toHaveBeenCalled();

    (document.body.firstElementChild as HTMLElement).click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    handle.close();
  });

  it('counts down and cancels when it reaches zero', () => {
    vi.useFakeTimers();
    const { handle, onCancel } = mount(pending, { timeoutMs: 3000 });
    expect(document.body.textContent).toContain('0:03');

    vi.advanceTimersByTime(2000);
    expect(document.body.textContent).toContain('0:01');
    expect(onCancel).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(onCancel).toHaveBeenCalledTimes(1);

    // The tick must stop at zero rather than keep firing cancel every second.
    vi.advanceTimersByTime(5000);
    expect(onCancel).toHaveBeenCalledTimes(1);
    handle.close();
  });

  // The provider's window is the real limit; our cap must never claim more.
  it('never promises more time than the provider allows', () => {
    vi.useFakeTimers();
    const { handle } = mount({ ...pending, expiresIn: 30 }, { timeoutMs: 120_000 });
    expect(document.body.textContent).toContain('0:30');
    handle.close();
  });

  it('close is idempotent and leaves nothing behind', () => {
    const { handle } = mount();
    handle.close();
    handle.close();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    // A surviving keydown listener would keep cancelling a flow that is gone.
    expect(document.body.children.length).toBe(0);
  });

  it('renders in the requested language and flips RTL for Arabic', () => {
    const { handle } = mount(pending, { locale: 'ar' });
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.dir).toBe('rtl');
    expect(document.body.textContent).toContain(strings('ar').title);
    handle.close();

    const ltr = mount(pending, { locale: 'sv' });
    expect((document.querySelector('[role="dialog"]') as HTMLElement).dir).toBe('ltr');
    expect(document.body.textContent).toContain(strings('sv').title);
    ltr.handle.close();
  });

  it('carries the theme onto the root so the stylesheet can pick it up', () => {
    const { handle } = mount(pending, { theme: 'dark' });
    expect((document.body.firstElementChild as HTMLElement).dataset.theme).toBe('dark');
    handle.close();
  });

  it('injects its stylesheet exactly once across mounts', () => {
    const a = mount();
    const b = mount();
    expect(document.querySelectorAll('#zoreal-pairing-styles').length).toBe(1);
    a.handle.close();
    b.handle.close();
  });
});
