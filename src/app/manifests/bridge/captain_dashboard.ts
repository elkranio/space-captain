import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const CAPTAIN_DASHBOARD_SPRITE_ID = {
    POWER_CORE_TOTAL: "power_core_total",
    HULL_TOTAL: "hull_total",
} as const;

export type CaptainDashboardSpriteId =
    (typeof CAPTAIN_DASHBOARD_SPRITE_ID)[keyof typeof CAPTAIN_DASHBOARD_SPRITE_ID];

export const CAPTAIN_DASHBOARD_SPRITES = {
    [CAPTAIN_DASHBOARD_SPRITE_ID.POWER_CORE_TOTAL]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "icons/resources/power_core_total",
    },

    [CAPTAIN_DASHBOARD_SPRITE_ID.HULL_TOTAL]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "icons/resources/hull_total",
    },
} satisfies Record<CaptainDashboardSpriteId, SpriteEntry>;
