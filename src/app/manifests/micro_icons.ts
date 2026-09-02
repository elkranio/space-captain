import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "./types";

export const MICRO_ICON_ID = {
    AMMO_MISSILE_STANDARD: "ammo_missile_standard",
    DEFENSE_TURRET_TARGET_AVAILABLE: "defense_turret_target_available",
    POWER_CHARGE: "power_charge",
    AMMO_STICKY_MINE: "ammo_sticky_mine",
} as const;

export type MicroIconId = (typeof MICRO_ICON_ID)[keyof typeof MICRO_ICON_ID];

export const MICRO_ICONS = {
    [MICRO_ICON_ID.AMMO_MISSILE_STANDARD]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "icons/micro/ammo_missile_standard",
    },

    [MICRO_ICON_ID.DEFENSE_TURRET_TARGET_AVAILABLE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "icons/micro/defense_turret_target_available",
    },

    [MICRO_ICON_ID.POWER_CHARGE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "icons/micro/power_charge",
    },

    [MICRO_ICON_ID.AMMO_STICKY_MINE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "icons/micro/ammo_mine_standard",
    },
} satisfies Record<MicroIconId, SpriteEntry>;
