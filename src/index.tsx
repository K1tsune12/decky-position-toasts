import { definePlugin, toaster } from '@decky/api';
import {
  ButtonItem,
  DropdownItem,
  PanelSection,
  PanelSectionRow,
  SliderField,
  ToggleField,
  staticClasses,
} from '@decky/ui';
import { FC, useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';

import { Animator } from './animator';
import { Key, LANGUAGE_NAMES, Lang, LangSetting, getLangSetting, initLanguage, setLangSetting, steamLanguageNow, t, useLanguage } from './i18n';
import { Positioner } from './positioner';
import { AnimDirection, AnimEffect, Corner, PosSettings, getSettings, saveSettings } from './settings';

const CORNER_OPTIONS: { data: Corner; label: Key }[] = [
  { data: Corner.TopLeft, label: 'corner.topLeft' },
  { data: Corner.TopRight, label: 'corner.topRight' },
  { data: Corner.BottomLeft, label: 'corner.bottomLeft' },
  { data: Corner.BottomRight, label: 'corner.bottomRight' },
];

const EFFECT_OPTIONS: { data: AnimEffect; label: Key }[] = [
  { data: 'slide-fade', label: 'effect.slideFade' },
  { data: 'slide', label: 'effect.slide' },
  { data: 'fade', label: 'effect.fade' },
  { data: 'scale', label: 'effect.scale' },
];

const DIRECTION_OPTIONS: { data: AnimDirection; label: Key }[] = [
  { data: 'left', label: 'direction.left' },
  { data: 'right', label: 'direction.right' },
  { data: 'top', label: 'direction.top' },
  { data: 'bottom', label: 'direction.bottom' },
];

/** Dropdown options with their labels in the current language. */
const localized = <T,>(options: { data: T; label: Key }[]) =>
  options.map((o) => ({ data: o.data, label: t(o.label) }));

let positioner: Positioner | undefined;
let animator: Animator | undefined;

function SettingsPanel() {
  useLanguage();
  const [s, setS] = useState<PosSettings>(() => getSettings());
  const update = (patch: Partial<PosSettings>) => setS(saveSettings(patch));

  const slideEffect = s.animEffect === 'slide' || s.animEffect === 'slide-fade';

  return (
    <>
      <PanelSection title={t('position.title')}>
        <PanelSectionRow>
          <ToggleField
            label={t('position.move')}
            description={t('position.moveDesc')}
            checked={s.enabled}
            onChange={(v) => update({ enabled: v })}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label={t('position.corner')}
            disabled={!s.enabled}
            selectedOption={s.corner}
            rgOptions={localized(CORNER_OPTIONS)}
            onChange={(o) => update({ corner: o.data as Corner })}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label={t('position.horizontal')}
            disabled={!s.enabled}
            value={s.horizontalInset}
            min={0}
            max={200}
            step={4}
            showValue
            onChange={(v) => update({ horizontalInset: v })}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label={t('position.vertical')}
            disabled={!s.enabled}
            value={s.verticalInset}
            min={0}
            max={200}
            step={4}
            showValue
            onChange={(v) => update({ verticalInset: v })}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title={t('anim.title')}>
        <PanelSectionRow>
          <ToggleField
            label={t('anim.custom')}
            description={t('anim.customDesc')}
            checked={s.animEnabled}
            onChange={(v) => update({ animEnabled: v })}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label={t('anim.effect')}
            disabled={!s.animEnabled}
            selectedOption={s.animEffect}
            rgOptions={localized(EFFECT_OPTIONS)}
            onChange={(o) => update({ animEffect: o.data as AnimEffect })}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label={t('anim.direction')}
            disabled={!s.animEnabled || !slideEffect}
            selectedOption={s.animDirection}
            rgOptions={localized(DIRECTION_OPTIONS)}
            onChange={(o) => update({ animDirection: o.data as AnimDirection })}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label={t('anim.duration')}
            disabled={!s.animEnabled}
            value={s.animDurationMs}
            min={100}
            max={1200}
            step={50}
            showValue
            onChange={(v) => update({ animDurationMs: v })}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title={t('preview.title')}>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() =>
              toaster.toast({ title: 'Decky Position Toasts', body: t('preview.toastBody') })
            }
          >
            {t('preview.send')}
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
      <LanguageSection />
    </>
  );
}

/** Language: automatic (Steam's) or picked here. */
const LanguageSection: FC = () => {
  const lang = useLanguage();
  const [setting, setSetting] = useState<LangSetting>(getLangSetting);
  const [steamLang, setSteamLang] = useState<Lang>(lang);
  useEffect(() => {
    void steamLanguageNow().then(setSteamLang);
  }, []);
  return (
    <PanelSection title={t('lang.title')}>
      <PanelSectionRow>
        <DropdownItem
          label={t('lang.label')}
          rgOptions={[
            { data: 'auto', label: t('lang.auto', { lang: LANGUAGE_NAMES[steamLang] }) },
            { data: 'en', label: LANGUAGE_NAMES.en },
            { data: 'pt-BR', label: LANGUAGE_NAMES['pt-BR'] },
          ]}
          selectedOption={setting}
          onChange={(o) => {
            setSetting(o.data as LangSetting);
            void setLangSetting(o.data as LangSetting);
          }}
        />
      </PanelSectionRow>
    </PanelSection>
  );
};

export default definePlugin(() => {
  void initLanguage();
  positioner = new Positioner();
  if (!positioner.init()) console.warn('[position-toasts] positioner disabled this session');

  animator = new Animator();
  if (!animator.init()) console.warn('[position-toasts] animator disabled this session');

  return {
    name: 'Decky Position Toasts',
    titleView: <div className={staticClasses.Title}>Decky Position Toasts</div>,
    content: <SettingsPanel />,
    icon: <FaBell />,
    onDismount() {
      positioner?.deinit();
      positioner = undefined;
      animator?.deinit();
      animator = undefined;
    },
  };
});
