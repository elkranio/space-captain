// src/engine/defs/player.ts

import type { PlayerLocationState } from './player_location';
import type { ShipWeaponState } from './ship_weapon';

export type PlayerShipState = {
    hull: number;
    maxHull: number;

    weapons: ShipWeaponState[];
};

export type PlayerState = {
    ship: PlayerShipState;
    location: PlayerLocationState;
};
