// src/app/manifests/combat/mines/mine_sprite.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../../types";

export const MINE_SPRITE_ID = {
    STICKY_00: "sticky_00",
} as const;

export type MineSpriteId = (typeof MINE_SPRITE_ID)[keyof typeof MINE_SPRITE_ID];

export const MINE_SPRITES = {
    [MINE_SPRITE_ID.STICKY_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "combat/mines/sticky_00",
    },
} satisfies Record<MineSpriteId, SpriteEntry>;
