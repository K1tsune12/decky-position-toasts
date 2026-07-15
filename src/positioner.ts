// Moves Steam's notification toasts using an internal SteamUI API that the Deck
// uses for per-game overlay notification placement but never exposes in the UI:
//
//   SteamUIStore.m_WindowStore.MainWindowInstance
//     .SetNotificationPosition(corner, horizontalInset, verticalInset)
//
// The value is read reactively (MobX) by the toast renderer, so setting it moves
// toasts live. We (1) apply on load, (2) re-apply on settings changes, and
// (3) re-apply on game start/stop, since Steam may reset the position when the
// running app changes. All wrapped so a failure never blocks the plugin load.

import { PosSettings, getSettings, subscribe } from './settings';

// SteamUIStore/SteamClient are globals injected by SteamUI; typed loosely here.
const w = window as any;

function getInstance(): any {
  return w.SteamUIStore?.m_WindowStore?.MainWindowInstance;
}

export class Positioner {
  private unsubSettings?: () => void;
  private appReg?: { unregister: () => void };

  init(): boolean {
    try {
      const inst = getInstance();
      if (!inst || typeof inst.SetNotificationPosition !== 'function') {
        console.warn('[position-toasts] SetNotificationPosition unavailable; disabled this session');
        return false;
      }

      this.apply(getSettings());
      this.unsubSettings = subscribe((s) => this.apply(s));

      // Re-apply shortly after any app starts/stops (Steam can reset position then).
      try {
        this.appReg = w.SteamClient?.GameSessions?.RegisterForAppLifetimeNotifications?.(() => {
          setTimeout(() => this.apply(getSettings()), 500);
        });
      } catch {
        /* optional hook */
      }
      return true;
    } catch (e) {
      console.error('[position-toasts] init failed', e);
      return false;
    }
  }

  apply(s: PosSettings): void {
    try {
      if (!s.enabled) return;
      const inst = getInstance();
      inst?.SetNotificationPosition?.(s.corner, s.horizontalInset, s.verticalInset);
    } catch (e) {
      console.error('[position-toasts] apply failed', e);
    }
  }

  deinit(): void {
    this.unsubSettings?.();
    this.unsubSettings = undefined;
    try {
      this.appReg?.unregister?.();
    } catch {
      /* ignore */
    }
    this.appReg = undefined;
  }
}
