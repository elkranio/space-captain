// src/app/manifests/bridge/combat_shields.ts

import {
    LASER_TARGET_ZONE,
    type LaserTargetZone,
} from '../../../engine/defs/laser';
import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const PLAYER_SHIELD_SPRITES = {
    [LASER_TARGET_ZONE.LEFT]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'combat/shields/side_left_00',
    },

    [LASER_TARGET_ZONE.CENTER]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'combat/shields/center_00',
    },

    [LASER_TARGET_ZONE.RIGHT]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'combat/shields/side_right_00',
    },
} satisfies Record<LaserTargetZone, SpriteEntry>;
