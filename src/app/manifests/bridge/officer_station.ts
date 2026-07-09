// src\app\manifests\bridge\officer_station.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const OFFICER_STATION_FRAME = {
    EMPTY: 'empty',
} as const;

export type OfficerStationFrame = (typeof OFFICER_STATION_FRAME)[keyof typeof OFFICER_STATION_FRAME];

export const OFFICER_STATION_FRAME_MANIFEST = {
    [OFFICER_STATION_FRAME.EMPTY]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/officer_station/frame_empty',
    },
} satisfies Record<OfficerStationFrame, SpriteEntry>;
