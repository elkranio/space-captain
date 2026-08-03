// src/app/manifests/bridge/seated_officer.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const BRIDGE_SEATED_OFFICER_SPRITE_ID = {
    SCIENCE_SEATED_00: 'science_seated_00',
    WEAPONS_SEATED_00: 'weapons_seated_00',
    HELM_SEATED_00: 'helm_seated_00',
    ENGINEER_SEATED_00: 'engineer_seated_00',
} as const;

export type BridgeSeatedOfficerSpriteId =
    (typeof BRIDGE_SEATED_OFFICER_SPRITE_ID)[keyof typeof BRIDGE_SEATED_OFFICER_SPRITE_ID];

export const BRIDGE_SEATED_OFFICER_SPRITES = {
    [BRIDGE_SEATED_OFFICER_SPRITE_ID.SCIENCE_SEATED_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/officers/science_seated_00',
    },
    [BRIDGE_SEATED_OFFICER_SPRITE_ID.WEAPONS_SEATED_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/officers/weapons_seated_00',
    },
    [BRIDGE_SEATED_OFFICER_SPRITE_ID.HELM_SEATED_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/officers/helm_seated_00',
    },
    [BRIDGE_SEATED_OFFICER_SPRITE_ID.ENGINEER_SEATED_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/officers/engineer_seated_00',
    },
} satisfies Record<BridgeSeatedOfficerSpriteId, SpriteEntry>;
