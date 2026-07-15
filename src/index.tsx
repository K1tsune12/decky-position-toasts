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
import { useState } from 'react';
import { FaBell } from 'react-icons/fa';

import { Animator } from './animator';
import { Positioner } from './positioner';
import { AnimDirection, AnimEffect, Corner, PosSettings, getSettings, saveSettings } from './settings';

const CORNER_OPTIONS: { data: Corner; label: string }[] = [
  { data: Corner.TopLeft, label: 'Top left' },
  { data: Corner.TopRight, label: 'Top right' },
  { data: Corner.BottomLeft, label: 'Bottom left' },
  { data: Corner.BottomRight, label: 'Bottom right' },
];

const EFFECT_OPTIONS: { data: AnimEffect; label: string }[] = [
  { data: 'slide-fade', label: 'Slide + fade' },
  { data: 'slide', label: 'Slide' },
  { data: 'fade', label: 'Fade' },
  { data: 'scale', label: 'Scale' },
];

const DIRECTION_OPTIONS: { data: AnimDirection; label: string }[] = [
  { data: 'left', label: 'From left' },
  { data: 'right', label: 'From right' },
  { data: 'top', label: 'From top' },
  { data: 'bottom', label: 'From bottom' },
];

let positioner: Positioner | undefined;
let animator: Animator | undefined;

function SettingsPanel() {
  const [s, setS] = useState<PosSettings>(() => getSettings());
  const update = (patch: Partial<PosSettings>) => setS(saveSettings(patch));

  const slideEffect = s.animEffect === 'slide' || s.animEffect === 'slide-fade';

  return (
    <>
      <PanelSection title="Position">
        <PanelSectionRow>
          <ToggleField
            label="Move notifications"
            description="When off, Steam's default position is used."
            checked={s.enabled}
            onChange={(v) => update({ enabled: v })}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label="Corner"
            disabled={!s.enabled}
            selectedOption={s.corner}
            rgOptions={CORNER_OPTIONS}
            onChange={(o) => update({ corner: o.data as Corner })}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="Horizontal margin (px)"
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
            label="Vertical margin (px)"
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

      <PanelSection title="Animation">
        <PanelSectionRow>
          <ToggleField
            label="Custom entry animation"
            description="When off, Steam's default animation is used."
            checked={s.animEnabled}
            onChange={(v) => update({ animEnabled: v })}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label="Effect"
            disabled={!s.animEnabled}
            selectedOption={s.animEffect}
            rgOptions={EFFECT_OPTIONS}
            onChange={(o) => update({ animEffect: o.data as AnimEffect })}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label="Comes from"
            disabled={!s.animEnabled || !slideEffect}
            selectedOption={s.animDirection}
            rgOptions={DIRECTION_OPTIONS}
            onChange={(o) => update({ animDirection: o.data as AnimDirection })}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="Duration (ms)"
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

      <PanelSection title="Preview">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() =>
              toaster.toast({ title: 'Position Toasts', body: 'Test notification — this is where toasts appear.' })
            }
          >
            Send test notification
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </>
  );
}

export default definePlugin(() => {
  positioner = new Positioner();
  if (!positioner.init()) console.warn('[position-toasts] positioner disabled this session');

  animator = new Animator();
  if (!animator.init()) console.warn('[position-toasts] animator disabled this session');

  return {
    name: 'Position Toasts',
    titleView: <div className={staticClasses.Title}>Position Toasts</div>,
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
