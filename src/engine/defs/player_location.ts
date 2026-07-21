// src/engine/defs/player_location.ts

export const PLAYER_LOCATION_KIND = {
    SPACE: 'space',
    STATION: 'station',
} as const;

export const PLAYER_SPACE_NAVIGATION_KIND = {
    ARRIVING: 'arriving',
    ANCHORED: 'anchored',
    TRAVELLING: 'travelling',
} as const;

export type PlayerSpaceArrivingNavigationState = {
    kind: typeof PLAYER_SPACE_NAVIGATION_KIND.ARRIVING;
    targetObjectId: string;
};

export type PlayerSpaceAnchoredNavigationState = {
    kind: typeof PLAYER_SPACE_NAVIGATION_KIND.ANCHORED;
    anchorObjectId: string;
};

export type PlayerSpaceTravellingNavigationState = {
    kind: typeof PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING;
    fromObjectId: string;
    targetObjectId: string;
};

export type PlayerSpaceNavigationState =
    | PlayerSpaceArrivingNavigationState
    | PlayerSpaceAnchoredNavigationState
    | PlayerSpaceTravellingNavigationState;

export type PlayerSpaceLocationState = {
    kind: typeof PLAYER_LOCATION_KIND.SPACE;
    nodeId: string;
    navigation: PlayerSpaceNavigationState;
};

export type PlayerStationLocationState = {
    kind: typeof PLAYER_LOCATION_KIND.STATION;
    nodeId: string;
    stationId: string;
};

export type PlayerLocationState = PlayerSpaceLocationState | PlayerStationLocationState;
