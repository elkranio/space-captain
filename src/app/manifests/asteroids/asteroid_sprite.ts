// src/app/manifests/asteroids/asteroid_sprite.ts
import { ASTEROID_OBJECT_SPRITE_ID, type AsteroidObjectSpriteId } from "../../../engine/defs/asteroid";
import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const ASTEROID_OBJECT_SPRITES = {
    [ASTEROID_OBJECT_SPRITE_ID.ASTEROID_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "asteroids/asteroid_00",
    },
} satisfies Record<AsteroidObjectSpriteId, SpriteEntry>;
