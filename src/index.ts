// src/index.ts

import Phaser from "phaser";
import gameConfig from "./config/gameConfig";
import Boot from "./app/scenes/system/boot/Boot";
import Preload from "./app/scenes/system/preload/Preload";

import InitScene from "./app/scenes/game/init/InitScene";
import BridgeScene from "./app/scenes/game/bridge/BridgeScene";
import EndScene from "./app/scenes/game/end/EndScene";

import { WEB_FONT_FAMILY } from "./app/theme/font";
import applyResponsiveScaling from "./utils/applyResponsiveScaling";
import enforceOrientation from "./utils/enforceOrientation";
import P34TOptions from "./config/p34t.options";

window.addEventListener("load", async () => {
    await document.fonts.load(`20px "${WEB_FONT_FAMILY.UI_PRIMARY}"`);

    applyResponsiveScaling(gameConfig);
    enforceOrientation();

    if (P34TOptions.title) {
        document.title = P34TOptions.title;
    }

    gameConfig.scene = [Boot, Preload, InitScene, BridgeScene, EndScene];

    new Phaser.Game(gameConfig);
});
