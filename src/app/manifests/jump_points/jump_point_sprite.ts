// src/app/manifests/jump_points/jump_point_sprite.ts

import { JUMP_POINT_OBJECT_SPRITE_ID, type JumpPointObjectSpriteId } from "../../../engine/defs/jump_point";
import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const JUMP_POINT_OBJECT_SPRITES = {
    [JUMP_POINT_OBJECT_SPRITE_ID.JUMP_POINT_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "world/jump_points/jump_point_00",
    },
} satisfies Record<JumpPointObjectSpriteId, SpriteEntry>;
