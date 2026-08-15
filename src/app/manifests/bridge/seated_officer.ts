// src/app/manifests/bridge/seated_officer.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const BRIDGE_SEATED_OFFICER_SPRITE_ID = {
    SCIENCE_SEATED_01_IDLE: 'science_seated_01_idle',
    HELM_SEATED_01_IDLE: 'helm_seated_01_idle',
    WEAPONS_SEATED_01_IDLE: 'weapons_seated_01_idle',
    ENGINEER_SEATED_01_IDLE: 'engineer_seated_01_idle',
} as const;

export type BridgeSeatedOfficerSpriteId =
    (typeof BRIDGE_SEATED_OFFICER_SPRITE_ID)[keyof typeof BRIDGE_SEATED_OFFICER_SPRITE_ID];

export const BRIDGE_SEATED_OFFICER_SPRITES = {
    [BRIDGE_SEATED_OFFICER_SPRITE_ID.SCIENCE_SEATED_01_IDLE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/science/idle',
    },
    [BRIDGE_SEATED_OFFICER_SPRITE_ID.HELM_SEATED_01_IDLE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/helm/idle',
    },
    [BRIDGE_SEATED_OFFICER_SPRITE_ID.WEAPONS_SEATED_01_IDLE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/weapons/idle',
    },
    [BRIDGE_SEATED_OFFICER_SPRITE_ID.ENGINEER_SEATED_01_IDLE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/engineer/idle',
    },
} satisfies Record<BridgeSeatedOfficerSpriteId, SpriteEntry>;
