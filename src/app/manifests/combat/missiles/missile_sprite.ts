// src/app/manifests/combat/missiles/missile_sprite.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../../types";

export const MISSILE_SPRITE_ID = {
    GENERIC_INCOMING_00: "generic_incoming_00",

    GENERIC_OUTGOING_00: "generic_outgoing_00",
} as const;

export type MissileSpriteId = (typeof MISSILE_SPRITE_ID)[keyof typeof MISSILE_SPRITE_ID];

export const MISSILE_SPRITES = {
    [MISSILE_SPRITE_ID.GENERIC_INCOMING_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,

        frameKey: "combat/missiles/generic_incoming_00",
    },

    [MISSILE_SPRITE_ID.GENERIC_OUTGOING_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,

        frameKey: "combat/missiles/generic_outgoing_00",
    },
} satisfies Record<MissileSpriteId, SpriteEntry>;
