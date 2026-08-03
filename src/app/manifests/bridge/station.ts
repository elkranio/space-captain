// src/app/manifests/bridge/station.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const BRIDGE_STATION_SPRITE_ID = {
    BASE_00: 'base_00',
} as const;

export type BridgeStationSpriteId =
    (typeof BRIDGE_STATION_SPRITE_ID)[keyof typeof BRIDGE_STATION_SPRITE_ID];

export const BRIDGE_STATION_SPRITES = {
    [BRIDGE_STATION_SPRITE_ID.BASE_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'bridge/station/base_00',
    },
} satisfies Record<BridgeStationSpriteId, SpriteEntry>;
