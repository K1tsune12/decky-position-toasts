// Customizes the toast entry animation by injecting a <style> into the toast
// render. The toast lives in a separate popup document, but the Decky loader
// already trampolines Steam's toast renderer (window.__TOASTER_INSTANCE). We
// REUSE that existing trampoline and chain our patch onto it — we must NOT call
// injectFCTrampoline ourselves, because a second trampoline on the same renderer
// corrupts Decky's and breaks all toasts.
//
// The style redefines the animation of the toast popup element; the class name
// is resolved from the CSS module at runtime so it survives Steam's hash rename.
// When animation is disabled we return the render untouched (fully safe).

import { Patch, afterPatch, findClassModule } from '@decky/ui';
import { createElement } from 'react';

import { AnimDirection, AnimEffect, PosSettings, getSettings } from './settings';

function resolveToastClass(): string {
  const mod = findClassModule((m: any) => m?.GamepadToastPopup && m?.toastEnter) as any;
  return mod?.GamepadToastPopup || '';
}

function slideFrom(dir: AnimDirection): string {
  switch (dir) {
    case 'left':
      return 'translateX(-140%)';
    case 'right':
      return 'translateX(140%)';
    case 'top':
      return 'translateY(-140%)';
    case 'bottom':
      return 'translateY(140%)';
  }
}

function keyframeBody(effect: AnimEffect, dir: AnimDirection): string {
  const slide = slideFrom(dir);
  switch (effect) {
    case 'fade':
      return `from { opacity: 0; } to { opacity: 1; }`;
    case 'scale':
      return `from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: none; }`;
    case 'slide':
      return `from { transform: ${slide}; } to { transform: none; }`;
    case 'slide-fade':
    default:
      return `from { opacity: 0; transform: ${slide}; } to { opacity: 1; transform: none; }`;
  }
}

function buildCss(s: PosSettings, cls: string): string {
  if (!s.animEnabled || !cls) return '';
  const name = 'tpEnter';
  return (
    `@keyframes ${name} { ${keyframeBody(s.animEffect, s.animDirection)} }` +
    `.${cls} { animation-name: ${name} !important;` +
    ` animation-duration: ${s.animDurationMs}ms !important;` +
    ` animation-timing-function: cubic-bezier(.2,.8,.2,1) !important; }`
  );
}

export class Animator {
  private patch?: Patch;
  private toastClass = '';

  init(): boolean {
    try {
      const toaster = (window as any).__TOASTER_INSTANCE;
      const obj = toaster?.toastPatch?.object;
      if (!obj || typeof obj.component !== 'function') {
        console.warn('[position-toasts] Decky toast trampoline not found; animation disabled');
        return false;
      }
      this.toastClass = resolveToastClass();

      // Chain onto Decky's existing trampoline. When animation is off, return the
      // render unchanged; otherwise prepend a <style> carrying our keyframes.
      this.patch = afterPatch(obj, 'component', (_args: any[], ret: any) => {
        try {
          const css = buildCss(getSettings(), this.toastClass);
          if (!css) return ret;
          const style = createElement('style', { key: 'tp-anim', 'data-tp': '1' }, css);
          return [style, ret];
        } catch {
          return ret;
        }
      });
      return true;
    } catch (e) {
      console.error('[position-toasts] animator init failed', e);
      return false;
    }
  }

  deinit(): void {
    try {
      this.patch?.unpatch();
    } catch {
      /* ignore */
    }
    this.patch = undefined;
  }
}
