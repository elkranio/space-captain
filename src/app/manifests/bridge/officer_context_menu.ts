// src/app/manifests/bridge/officer_context_menu.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const OFFICER_CONTEXT_MENU_SPRITE_ID = {
    PANEL_TOP: 'panel_top',
    PANEL_MIDDLE: 'panel_middle',
    PANEL_BOTTOM: 'panel_bottom',
    COMMAND_ROW: 'command_row',
    COMMAND_ROW_HOVER: 'command_row_hover',
} as const;

export type OfficerContextMenuSpriteId =
    (typeof OFFICER_CONTEXT_MENU_SPRITE_ID)[keyof typeof OFFICER_CONTEXT_MENU_SPRITE_ID];

export const OFFICER_CONTEXT_MENU_SPRITES = {
    [OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_TOP]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/ui/officer_context_menu/panel_top',
    },

    [OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_MIDDLE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/ui/officer_context_menu/panel_middle',
    },

    [OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_BOTTOM]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/ui/officer_context_menu/panel_bottom',
    },

    [OFFICER_CONTEXT_MENU_SPRITE_ID.COMMAND_ROW]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/ui/officer_context_menu/command_row',
    },

    [OFFICER_CONTEXT_MENU_SPRITE_ID.COMMAND_ROW_HOVER]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/ui/officer_context_menu/command_row_hover',
    },
} satisfies Record<OfficerContextMenuSpriteId, SpriteEntry>;
