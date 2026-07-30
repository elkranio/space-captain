// src/engine/defs/player.ts

import type { PlayerLocationState } from './player_location';
import type { PointDefenseState } from './point_defense';
import type { ShieldGeneratorState } from './shield_generator';
import type { ShipWeaponState } from './ship_weapon';

export type PlayerShipState = {
    hull: number;
    maxHull: number;

    pointDefense: PointDefenseState;
    shieldGenerator: ShieldGeneratorState;

    weapons: ShipWeaponState[];
};

export type PlayerState = {
    ship: PlayerShipState;
    location: PlayerLocationState;
};
