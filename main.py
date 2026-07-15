"""Decky Position Toasts backend. Logic is frontend-only; this satisfies Decky's
plugin contract and logs lifecycle events."""

import decky


class Plugin:
    """Decky plugin entry point."""

    async def _main(self):
        decky.logger.info("Decky Position Toasts loaded")

    async def _unload(self):
        decky.logger.info("Decky Position Toasts unloaded")

    async def _uninstall(self):
        decky.logger.info("Decky Position Toasts uninstalled")
