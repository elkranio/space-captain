import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const CAPTAIN_DASHBOARD_SPRITE_ID = {
    SCREEN: "screen",
    POWER_CORE_ICON: "power_core_icon",
    MISSILE_LAUNCHER_SIMPLE_ROCKET: "missile_launcher_simple_rocket",
} as const;

export type CaptainDashboardSpriteId =
    (typeof CAPTAIN_DASHBOARD_SPRITE_ID)[keyof typeof CAPTAIN_DASHBOARD_SPRITE_ID];

export const CAPTAIN_DASHBOARD_SPRITES = {
    [CAPTAIN_DASHBOARD_SPRITE_ID.SCREEN]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "bridge/ui/captain_dashboard/screen",
    },

    [CAPTAIN_DASHBOARD_SPRITE_ID.POWER_CORE_ICON]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "bridge/ui/captain_dashboard/power_core_icon",
    },

    [CAPTAIN_DASHBOARD_SPRITE_ID.MISSILE_LAUNCHER_SIMPLE_ROCKET]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "equipment/missile_launchers/light_rack/icon",
    },
} satisfies Record<CaptainDashboardSpriteId, SpriteEntry>;
