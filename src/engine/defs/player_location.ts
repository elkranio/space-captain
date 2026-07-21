// src/engine/defs/player_location.ts
export const PLAYER_LOCATION_KIND = {
    SPACE: 'space',
    STATION: 'station',
} as const;

export type PlayerSpaceLocationState = {
    kind: typeof PLAYER_LOCATION_KIND.SPACE;
    nodeId: string;
};

export type PlayerStationLocationState = {
    kind: typeof PLAYER_LOCATION_KIND.STATION;
    nodeId: string;
    stationId: string;
};

export type PlayerLocationState = PlayerSpaceLocationState | PlayerStationLocationState;
