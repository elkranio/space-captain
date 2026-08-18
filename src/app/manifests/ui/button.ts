// src/app/manifests/ui/button.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const UI_BUTTON_SPRITE_ID = {
    CLOSE_00: "close_00",
} as const;

export type UiButtonSpriteId = (typeof UI_BUTTON_SPRITE_ID)[keyof typeof UI_BUTTON_SPRITE_ID];

export const UI_BUTTON_SPRITES = {
    [UI_BUTTON_SPRITE_ID.CLOSE_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/buttons/close_00",
    },
} satisfies Record<UiButtonSpriteId, SpriteEntry>;
