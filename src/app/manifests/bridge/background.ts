// src\app\manifests\bridge\background.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const BRIDGE_BACKGROUND_ID = {
    SPACE_GENERIC: 'space_generic',
} as const;

export type BridgeBackgroundId = (typeof BRIDGE_BACKGROUND_ID)[keyof typeof BRIDGE_BACKGROUND_ID];

export const BRIDGE_BACKGROUND_SPRITES = {
    [BRIDGE_BACKGROUND_ID.SPACE_GENERIC]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/backgrounds/space_generic',
    },
} satisfies Record<BridgeBackgroundId, SpriteEntry>;
