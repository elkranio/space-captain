// src/app/manifests/bridge/seated_officer.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const BRIDGE_SEATED_OFFICER_SPRITE_ID = {
    SCIENTIST_IDLE: "science_idle",
    PILOT_IDLE: "helm_idle",
    GUNNER_IDLE: "weapons_idle",
    ENGINEER_IDLE: "engineer_idle",

    // Temporary source-compatibility aliases.
    SCIENCE_IDLE: "science_idle",
    HELM_IDLE: "helm_idle",
    WEAPONS_IDLE: "weapons_idle",
} as const;

export type BridgeSeatedOfficerSpriteId =
    (typeof BRIDGE_SEATED_OFFICER_SPRITE_ID)[keyof typeof BRIDGE_SEATED_OFFICER_SPRITE_ID];

export const BRIDGE_SEATED_OFFICER_SPRITES = {
    [BRIDGE_SEATED_OFFICER_SPRITE_ID.SCIENTIST_IDLE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "bridge/officers/science/idle",
    },
    [BRIDGE_SEATED_OFFICER_SPRITE_ID.PILOT_IDLE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "bridge/officers/helm/idle",
    },
    [BRIDGE_SEATED_OFFICER_SPRITE_ID.GUNNER_IDLE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "bridge/officers/weapons/idle",
    },
    [BRIDGE_SEATED_OFFICER_SPRITE_ID.ENGINEER_IDLE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "bridge/officers/engineer/idle",
    },
} satisfies Record<BridgeSeatedOfficerSpriteId, SpriteEntry>;
