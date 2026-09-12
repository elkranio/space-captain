import { OFFICER_ROLE, type OfficerRole } from "../../../engine/defs/officer";
import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const BRIDGE_OFFICER_PORTRAIT_STATE = {
    IDLE: "idle",
    ACTIVE: "active",
    STUNNED: "stunned",
    INCAPACITATED: "incapacitated",
} as const;

export type BridgeOfficerPortraitState =
    (typeof BRIDGE_OFFICER_PORTRAIT_STATE)[keyof typeof BRIDGE_OFFICER_PORTRAIT_STATE];

export const BRIDGE_OFFICER_PORTRAIT_SPRITES = {
    [OFFICER_ROLE.SCIENTIST]: {
        [BRIDGE_OFFICER_PORTRAIT_STATE.IDLE]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/scientist/idle",
        },
        [BRIDGE_OFFICER_PORTRAIT_STATE.ACTIVE]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/scientist/active",
        },
        [BRIDGE_OFFICER_PORTRAIT_STATE.STUNNED]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/scientist/stunned",
        },
        [BRIDGE_OFFICER_PORTRAIT_STATE.INCAPACITATED]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/scientist/incapacitated",
        },
    },
    [OFFICER_ROLE.PILOT]: {
        [BRIDGE_OFFICER_PORTRAIT_STATE.IDLE]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/pilot/idle",
        },
        [BRIDGE_OFFICER_PORTRAIT_STATE.ACTIVE]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/pilot/active",
        },
        [BRIDGE_OFFICER_PORTRAIT_STATE.STUNNED]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/pilot/stunned",
        },
        [BRIDGE_OFFICER_PORTRAIT_STATE.INCAPACITATED]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/pilot/incapacitated",
        },
    },
    [OFFICER_ROLE.GUNNER]: {
        [BRIDGE_OFFICER_PORTRAIT_STATE.IDLE]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/gunner/idle",
        },
        [BRIDGE_OFFICER_PORTRAIT_STATE.ACTIVE]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/gunner/active",
        },
        [BRIDGE_OFFICER_PORTRAIT_STATE.STUNNED]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/gunner/stunned",
        },
        [BRIDGE_OFFICER_PORTRAIT_STATE.INCAPACITATED]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/gunner/incapacitated",
        },
    },
    [OFFICER_ROLE.ENGINEER]: {
        [BRIDGE_OFFICER_PORTRAIT_STATE.IDLE]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/engineer/idle",
        },
        [BRIDGE_OFFICER_PORTRAIT_STATE.ACTIVE]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/engineer/active",
        },
        [BRIDGE_OFFICER_PORTRAIT_STATE.STUNNED]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/engineer/stunned",
        },
        [BRIDGE_OFFICER_PORTRAIT_STATE.INCAPACITATED]: {
            atlasKey: DEFAULT_ATLAS_KEY,
            frameKey: "bridge/officers/engineer/incapacitated",
        },
    },
} satisfies Record<OfficerRole, Record<BridgeOfficerPortraitState, SpriteEntry>>;
