// src/engine/defs/jump_point.ts

export const JUMP_POINT_OBJECT_SPRITE_ID = {
    JUMP_POINT: "jump_point",
} as const;

export type JumpPointObjectSpriteId = (typeof JUMP_POINT_OBJECT_SPRITE_ID)[keyof typeof JUMP_POINT_OBJECT_SPRITE_ID];

export type JumpPointState = {
    id: string;
    name: string;

    // Нода, для прыжка в которую рассчитана эта точка.
    targetNodeId: string;

    objectSpriteId: JumpPointObjectSpriteId;
};
