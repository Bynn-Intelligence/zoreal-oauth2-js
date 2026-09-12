// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { controlFrom, cornerOf, holdBusy } from '../src/busy';

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

describe('the ring corner for the control it sits on', () => {
  // An SVG rect clamps rx to half its width and ry to half its height on their
  // own, so a pill's radius copied into both made an ellipse: the clamp must
  // happen before the rect sees the value.
  it('turns a pill radius into the half height, however it is spelled', () => {
    expect(cornerOf('9999px', 720, 68)).toEqual([36, 36]);
    expect(cornerOf('3.35544e+07px', 720, 68)).toEqual([36, 36]);
    expect(cornerOf('calc(infinity * 1px)', 720, 68)).toEqual([36, 36]);
  });

  it('keeps a small radius as it is, and follows a percentage per axis', () => {
    expect(cornerOf('12px', 300, 44)).toEqual([14, 14]);
    expect(cornerOf('50%', 300, 44)).toEqual([152, 24]);
  });

  it('never exceeds half the width of a narrow control', () => {
    expect(cornerOf('9999px', 40, 68)).toEqual([22, 22]);
  });
});
