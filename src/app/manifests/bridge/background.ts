// src\app\manifests\bridge\background.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const BRIDGE_BACKGROUND = {
    SPACE_GENERIC: 'space_generic',
} as const;

export type BridgeBackground = (typeof BRIDGE_BACKGROUND)[keyof typeof BRIDGE_BACKGROUND];

export const BRIDGE_BACKGROUND_MANIFEST = {
    [BRIDGE_BACKGROUND.SPACE_GENERIC]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/backgrounds/space_generic',
    },
} satisfies Record<BridgeBackground, SpriteEntry>;
