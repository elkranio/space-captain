// src/engine/defs/player.ts

import type { PlayerLocationState } from './player_location';

export type PlayerShipState = {
    hull: number;
    maxHull: number;
};

export type PlayerState = {
    ship: PlayerShipState;
    location: PlayerLocationState;
};
