// src/engine/defs/player.ts

import type {
    PowerCoreState,
} from './power_core';
import type { PlayerLocationState } from './player_location';
import type { ShipDriveState } from './ship_drive';
import type { ShipWeaponState } from './ship_weapon';
import type {
    ShieldEmitterState,
} from './shield_emitter';

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

        powerCore:
            PowerCoreState;

        shieldEmitter:
            ShieldEmitterState;

        weapons:
            ShipWeaponState[];
    };

export type PlayerState = {
    ship: PlayerShipState;
    location: PlayerLocationState;
};
