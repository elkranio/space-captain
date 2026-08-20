import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const CAPTAIN_DASHBOARD_SPRITE_ID = {
    SCREEN: "screen",
} as const;

export type CaptainDashboardSpriteId =
    (typeof CAPTAIN_DASHBOARD_SPRITE_ID)[keyof typeof CAPTAIN_DASHBOARD_SPRITE_ID];

export const CAPTAIN_DASHBOARD_SPRITES = {
    [CAPTAIN_DASHBOARD_SPRITE_ID.SCREEN]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "bridge/ui/captain_dashboard/screen",
    },
} satisfies Record<CaptainDashboardSpriteId, SpriteEntry>;
