// src/app/manifests/ui/contact_panel.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const CONTACT_PANEL_SPRITE_ID = {
    PANEL_00: 'panel_00',
} as const;

export type ContactPanelSpriteId = (typeof CONTACT_PANEL_SPRITE_ID)[keyof typeof CONTACT_PANEL_SPRITE_ID];

export const CONTACT_PANEL_SPRITES = {
    [CONTACT_PANEL_SPRITE_ID.PANEL_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'ui/contact_panel/panel_00',
    },
} satisfies Record<ContactPanelSpriteId, SpriteEntry>;
