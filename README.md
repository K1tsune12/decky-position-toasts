# Position Toasts

A [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) plugin that
moves Steam Deck notification toasts to any corner of the screen, with adjustable
margins and a custom entry animation. Companion to
[Sound Toasts](https://github.com/K1tsune12/sound-toasts).

## Features

- Choose the corner: top-left, top-right, bottom-left, or bottom-right.
- Adjustable horizontal and vertical margins (px).
- Custom entry animation: effect (slide / fade / scale / slide+fade), direction,
  and duration.
- Applies live and re-applies on boot and when a game starts/stops.

## How it works

Steam's Game Mode (Big Picture / Gamepad UI) already has an internal notification
position API — it's used for per-game overlay placement but isn't exposed in the
Settings UI. This plugin drives it:

```
SteamUIStore.m_WindowStore.MainWindowInstance
  .SetNotificationPosition(corner, horizontalInset, verticalInset)
```

The toast renderer reads this value reactively, so changing it moves toasts
immediately. Corner values: `0` top-left, `1` top-right, `2` bottom-left,
`3` bottom-right.

> Note: this is an internal Steam API and may change with a Steam client update.
> If it stops working, the plugin fails safe (does nothing) and logs a warning.

## Build

```bash
pnpm install
pnpm run build   # outputs dist/index.js
```

## Install

Decky → Developer Mode → **Install Plugin from ZIP**, then select the packaged
zip. Or copy the plugin folder into `~/homebrew/plugins/` and restart Decky.

## Usage

Open the plugin in the Quick Access Menu, turn on **Move notifications**, pick a
corner, and adjust the margins. Use **Send test notification** to preview.

## License

BSD-3-Clause — see [LICENSE](LICENSE).
