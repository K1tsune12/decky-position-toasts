// Minimal i18n: English + Brazilian Portuguese. The language follows Steam's
// UI language (Portuguese -> pt-BR, anything else -> English).

import { useEffect, useReducer } from 'react';

export type Lang = 'en' | 'pt-BR';

const en = {
  'lang.title': 'Language',
  'lang.label': 'Language',
  'lang.auto': 'Automatic ({lang})',
  // position
  'position.title': 'Position',
  'position.move': 'Move notifications',
  'position.moveDesc': "When off, Steam's default position is used.",
  'position.corner': 'Corner',
  'position.horizontal': 'Horizontal margin (px)',
  'position.vertical': 'Vertical margin (px)',
  'corner.topLeft': 'Top left',
  'corner.topRight': 'Top right',
  'corner.bottomLeft': 'Bottom left',
  'corner.bottomRight': 'Bottom right',

  // animation
  'anim.title': 'Animation',
  'anim.custom': 'Custom entry animation',
  'anim.customDesc': "When off, Steam's default animation is used.",
  'anim.effect': 'Effect',
  'anim.direction': 'Comes from',
  'anim.duration': 'Duration (ms)',
  'effect.slideFade': 'Slide + fade',
  'effect.slide': 'Slide',
  'effect.fade': 'Fade',
  'effect.scale': 'Scale',
  'direction.left': 'From left',
  'direction.right': 'From right',
  'direction.top': 'From top',
  'direction.bottom': 'From bottom',

  // preview
  'preview.title': 'Preview',
  'preview.toastBody': 'Test notification — this is where toasts appear.',
  'preview.send': 'Send test notification',
};

export type Key = keyof typeof en;

const ptBR: Record<Key, string> = {
  'lang.title': 'Idioma',
  'lang.label': 'Idioma',
  'lang.auto': 'Automático ({lang})',
  'position.title': 'Posição',
  'position.move': 'Mover notificações',
  'position.moveDesc': 'Desligado: usa a posição padrão do Steam.',
  'position.corner': 'Canto',
  'position.horizontal': 'Margem horizontal (px)',
  'position.vertical': 'Margem vertical (px)',
  'corner.topLeft': 'Superior esquerdo',
  'corner.topRight': 'Superior direito',
  'corner.bottomLeft': 'Inferior esquerdo',
  'corner.bottomRight': 'Inferior direito',

  'anim.title': 'Animação',
  'anim.custom': 'Animação de entrada personalizada',
  'anim.customDesc': 'Desligado: usa a animação padrão do Steam.',
  'anim.effect': 'Efeito',
  'anim.direction': 'Vem de',
  'anim.duration': 'Duração (ms)',
  'effect.slideFade': 'Deslizar + esmaecer',
  'effect.slide': 'Deslizar',
  'effect.fade': 'Esmaecer',
  'effect.scale': 'Crescer',
  'direction.left': 'Da esquerda',
  'direction.right': 'Da direita',
  'direction.top': 'De cima',
  'direction.bottom': 'De baixo',

  'preview.title': 'Prévia',
  'preview.toastBody': 'Notificação de teste: é aqui que as notificações aparecem.',
  'preview.send': 'Enviar notificação de teste',
};

const TABLES: Record<Lang, Record<Key, string>> = { en, 'pt-BR': ptBR };

let current: Lang = 'en';
const listeners = new Set<() => void>();

export function t(key: Key, vars?: Record<string, string | number>): string {
  let text = TABLES[current][key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
  return text;
}

async function steamLanguage(): Promise<Lang> {
  try {
    const lang: string = await (window as any).SteamClient.Settings.GetCurrentLanguage();
    return lang === 'brazilian' || lang === 'portuguese' ? 'pt-BR' : 'en';
  } catch {
    return 'en';
  }
}

export type LangSetting = 'auto' | Lang;
const SETTING_KEY = 'decky-position-toasts:lang';

/** Language names are always shown in their own language. */
export const LANGUAGE_NAMES: Record<Lang, string> = { en: 'English', 'pt-BR': 'Português (Brasil)' };

/** 'auto' follows Steam's language; otherwise the language picked in the panel. */
export function getLangSetting(): LangSetting {
  try {
    const v = localStorage.getItem(SETTING_KEY);
    return v === 'en' || v === 'pt-BR' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

/** The language Steam itself uses, for the "Automatic" label. */
export const steamLanguageNow = steamLanguage;

async function apply(setting: LangSetting): Promise<void> {
  current = setting === 'auto' ? await steamLanguage() : setting;
  listeners.forEach((l) => l());
}

/** Applies the saved choice (or Steam's language) and re-renders anything using useLanguage(). */
export function initLanguage(): Promise<void> {
  return apply(getLangSetting());
}

export function setLangSetting(setting: LangSetting): Promise<void> {
  try {
    if (setting === 'auto') localStorage.removeItem(SETTING_KEY);
    else localStorage.setItem(SETTING_KEY, setting);
  } catch {
    // only a convenience: the language still changes for this session
  }
  return apply(setting);
}

/** Re-render the calling component when the language changes. */
export function useLanguage(): Lang {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
    };
  }, []);
  return current;
}
