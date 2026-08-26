import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const UI_OFFICER_MONITOR_SPRITE_ID = {
    FRAME: "frame",
} as const;

export type UiOfficerMonitorSpriteId =
    (typeof UI_OFFICER_MONITOR_SPRITE_ID)[keyof typeof UI_OFFICER_MONITOR_SPRITE_ID];

export const UI_OFFICER_MONITOR_SPRITES = {
    [UI_OFFICER_MONITOR_SPRITE_ID.FRAME]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/officer_monitor/frame",
    },
} satisfies Record<UiOfficerMonitorSpriteId, SpriteEntry>;
