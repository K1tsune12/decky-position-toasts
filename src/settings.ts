// Settings model + persistence (localStorage — SteamUI keeps it across sessions).

// Steam's internal notification-corner enum (EPosition).
export enum Corner {
  TopLeft = 0,
  TopRight = 1,
  BottomLeft = 2,
  BottomRight = 3,
}

export type AnimEffect = 'slide' | 'fade' | 'scale' | 'slide-fade';
export type AnimDirection = 'left' | 'right' | 'top' | 'bottom';

export interface PosSettings {
  /** When off, the plugin leaves Steam's default position untouched. */
  enabled: boolean;
  corner: Corner;
  /** Margin from the left/right screen edge, in px. */
  horizontalInset: number;
  /** Margin from the top/bottom screen edge, in px. */
  verticalInset: number;

  /** When off, the plugin leaves Steam's default toast animation untouched. */
  animEnabled: boolean;
  /** Entry animation style. */
  animEffect: AnimEffect;
  /** For slide effects, the edge the toast starts from. */
  animDirection: AnimDirection;
  /** Entry animation duration, in ms. */
  animDurationMs: number;
}

// Default mirrors Steam's own default (bottom-right, no inset) so installing the
// plugin changes nothing until the user picks a corner.
export const DEFAULT_SETTINGS: PosSettings = {
  enabled: true,
  corner: Corner.BottomRight,
  horizontalInset: 0,
  verticalInset: 0,

  animEnabled: false,
  animEffect: 'slide-fade',
  animDirection: 'right',
  animDurationMs: 300,
};

const STORAGE_KEY = 'position-toasts:settings';

type Listener = (s: PosSettings) => void;
const listeners = new Set<Listener>();
let cache: PosSettings | null = null;

export function getSettings(): PosSettings {
  if (cache) return cache;
  let next: PosSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    next = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    next = { ...DEFAULT_SETTINGS };
  }
  cache = next;
  return next;
}

export function saveSettings(patch: Partial<PosSettings>): PosSettings {
  const next = { ...getSettings(), ...patch };
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore write failures — cache still holds the value
  }
  listeners.forEach((l) => l(next));
  return next;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
