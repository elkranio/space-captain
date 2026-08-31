import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "./types";

export const AMMO_SPRITE_ID = {
    MISSILE_STANDARD: "missile_standard",
} as const;

export type AmmoSpriteId = (typeof AMMO_SPRITE_ID)[keyof typeof AMMO_SPRITE_ID];

export const AMMO_SPRITES = {
    [AMMO_SPRITE_ID.MISSILE_STANDARD]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ammo/icon_missile_standard",
    },
} satisfies Record<AmmoSpriteId, SpriteEntry>;
