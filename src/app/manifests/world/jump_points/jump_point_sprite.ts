// src/app/manifests/world/jump_points/jump_point_sprite.ts

import { JUMP_POINT_OBJECT_SPRITE_ID, type JumpPointObjectSpriteId } from "../../../../engine/defs/jump_point";
import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../../types";

export const JUMP_POINT_OBJECT_SPRITES = {
    [JUMP_POINT_OBJECT_SPRITE_ID.JUMP_POINT]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "world/jump_points/jump_point",
    },
} satisfies Record<JumpPointObjectSpriteId, SpriteEntry>;
