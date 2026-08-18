// src/app/scenes/game/bridge/view/combat/bridge_player_weapon_layout.ts

import { BRIDGE_VIEWSCREEN_RECT } from "../bridge_viewscreen_layout";

const BRIDGE_PLAYER_WEAPON_LAYOUT = {
    sourceXRatio: 1 / 2,

    // Starts behind the lower edge
    // of the viewscreen.
    sourceYFromBottom: 18,
} as const;

export function getBridgePlayerWeaponSourcePosition(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
        Math.round(BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width * BRIDGE_PLAYER_WEAPON_LAYOUT.sourceXRatio),

        BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height - BRIDGE_PLAYER_WEAPON_LAYOUT.sourceYFromBottom,
    );
}
