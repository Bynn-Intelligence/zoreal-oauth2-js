// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { controlFrom, holdBusy } from '../src/busy';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('holding a control busy', () => {
  it('disables the control, puts the light over it, and puts everything back on release', () => {
    const button = document.createElement('button');
    button.textContent = 'Continue with ZOREAL';
    document.body.appendChild(button);

    const release = holdBusy(button);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    const overlay = document.querySelector<HTMLElement>('.zrl-ring-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay!.dataset.busy).toBe('true');
    expect(overlay!.querySelectorAll('rect').length).toBe(15);
    // Nothing of the site\'s markup changed: the button has the same parent.
    expect(button.parentElement).toBe(document.body);

    release();
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('aria-busy')).toBe(false);
    expect(document.querySelector('.zrl-ring-overlay')).toBeNull();
    // A second release is harmless.
    release();
  });

  it('keeps a disabled control disabled after release', () => {
    const button = document.createElement('button');
    button.disabled = true;
    document.body.appendChild(button);
    holdBusy(button)();
    expect(button.disabled).toBe(true);
  });

  it('takes the control from a click event and nothing else', () => {
    const button = document.createElement('button');
    expect(controlFrom({ currentTarget: button })).toBe(button);
    expect(controlFrom({ currentTarget: null })).toBeNull();
    expect(controlFrom(undefined)).toBeNull();
    expect(controlFrom('click')).toBeNull();
  });
});
