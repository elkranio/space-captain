// src/app/manifests/ui/local_space_panel.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const LOCAL_SPACE_PANEL_SPRITE_ID = {
    TOP: 'top',
    MIDDLE: 'middle',
    BOTTOM: 'bottom',
} as const;

export type LocalSpacePanelSpriteId = (typeof LOCAL_SPACE_PANEL_SPRITE_ID)[keyof typeof LOCAL_SPACE_PANEL_SPRITE_ID];

export const LOCAL_SPACE_PANEL_SPRITES = {
    [LOCAL_SPACE_PANEL_SPRITE_ID.TOP]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'ui/local_space_panel/top',
    },

    [LOCAL_SPACE_PANEL_SPRITE_ID.MIDDLE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'ui/local_space_panel/middle',
    },

    [LOCAL_SPACE_PANEL_SPRITE_ID.BOTTOM]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'ui/local_space_panel/bottom',
    },
} satisfies Record<LocalSpacePanelSpriteId, SpriteEntry>;
