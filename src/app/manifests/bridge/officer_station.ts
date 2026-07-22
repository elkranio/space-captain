// src/app/manifests/bridge/officer_station.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const OFFICER_STATION_SPRITE_ID = {
    FRAME_EMPTY: 'frame_empty',
    STATUS_LIGHT_READY_00: 'status_light_ready_00',
    STATUS_LIGHT_BUSY_00: 'status_light_busy_00',
    STATUS_LIGHT_BLOCKED_00: 'status_light_blocked_00',
} as const;

export type OfficerStationSpriteId = (typeof OFFICER_STATION_SPRITE_ID)[keyof typeof OFFICER_STATION_SPRITE_ID];

export const OFFICER_STATION_SPRITES = {
    [OFFICER_STATION_SPRITE_ID.FRAME_EMPTY]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/officer_station/frame_empty',
    },

    [OFFICER_STATION_SPRITE_ID.STATUS_LIGHT_READY_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/officer_station/status_light_ready_00',
    },

    [OFFICER_STATION_SPRITE_ID.STATUS_LIGHT_BUSY_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/officer_station/status_light_busy_00',
    },

    [OFFICER_STATION_SPRITE_ID.STATUS_LIGHT_BLOCKED_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/officer_station/status_light_blocked_00',
    },
} satisfies Record<OfficerStationSpriteId, SpriteEntry>;
