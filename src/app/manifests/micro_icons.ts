import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "./types";

export const MICRO_ICON_ID = {
    AMMO_MISSILE_STANDARD: "ammo_missile_standard",
    POWER_CHARGE: "power_charge",
} as const;

export type MicroIconId = (typeof MICRO_ICON_ID)[keyof typeof MICRO_ICON_ID];

export const MICRO_ICONS = {
    [MICRO_ICON_ID.AMMO_MISSILE_STANDARD]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "icons/micro/ammo_missile_standard",
    },

    [MICRO_ICON_ID.POWER_CHARGE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "icons/micro/power_charge",
    },
} satisfies Record<MicroIconId, SpriteEntry>;
