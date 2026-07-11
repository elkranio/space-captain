// src\app\manifests\bridge\officer_station.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const OFFICER_STATION_FRAME_ID = {
    EMPTY: 'empty',
} as const;

export type OfficerStationFrameId = (typeof OFFICER_STATION_FRAME_ID)[keyof typeof OFFICER_STATION_FRAME_ID];

export const OFFICER_STATION_FRAME_SPRITES = {
    [OFFICER_STATION_FRAME_ID.EMPTY]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/officer_station/frame_empty',
    },
} satisfies Record<OfficerStationFrameId, SpriteEntry>;
