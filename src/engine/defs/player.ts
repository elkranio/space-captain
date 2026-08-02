// src/engine/defs/player.ts

import type { PlayerLocationState } from './player_location';
import type { PointDefenseState } from './point_defense';
import type { ShieldGeneratorState } from './shield_generator';
import type { ShipDriveState } from './ship_drive';
import type { ShipWeaponState } from './ship_weapon';

export type PlayerHullState = {
    hull: number;
    maxHull: number;
};

export type PlayerHullDamageResult = {
    appliedDamage: number;
    remainingHull: number;
    destroyed: boolean;
};

export type PlayerShipState =
    PlayerHullState & {
        drive: ShipDriveState;

        pointDefense:
            PointDefenseState;

        shieldGenerator:
            ShieldGeneratorState;

        weapons:
            ShipWeaponState[];
    };

export type PlayerState = {
    ship: PlayerShipState;
    location: PlayerLocationState;
};
