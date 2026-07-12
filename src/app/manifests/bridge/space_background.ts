// src\app\manifests\bridge\space_background.ts

import { SPACE_BACKGROUND_ID, type SpaceBackgroundId } from '../../../engine/defs/space_background';
import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const SPACE_BACKGROUND_SPRITES = {
    [SPACE_BACKGROUND_ID.NEBULA_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/space/nebula_00',
    },
} satisfies Record<SpaceBackgroundId, SpriteEntry>;
