// src/engine/encounter/actors/ship/ship_encounter_actor.ts

import type {
    ShieldGeneratorState,
} from '../../../defs/shield_generator';
import type {
    ShipChassisId,
} from '../../../defs/ship_chassis';
import type {
    ShipDriveState,
} from '../../../defs/ship_drive';
import type {
    ShipWeaponState,
} from '../../../defs/ship_weapon';
import {
    ENCOUNTER_ACTOR_KIND,
    type EncounterActorBaseState,
} from '../encounter_actor';

// Runtime-состояние конкретного корабля
// внутри текущего encounter.
//
// chassisId указывает
// на стабильный ShipChassisDefinition.
// id остаётся runtime id конкретного экземпляра.
export type ShipEncounterActorState =
    EncounterActorBaseState & {
        kind:
            typeof ENCOUNTER_ACTOR_KIND.SHIP;

        chassisId: ShipChassisId;

        hull: number;
        maxHull: number;

        drive: ShipDriveState;
        shieldGenerator:
            ShieldGeneratorState;

        // Одноразовое opening action этого ship
        // внутри текущего encounter.
        hasUsedOpeningDisruptionPulse: boolean;

        // Mutable loadout
        // только текущего encounter.
        weapons: ShipWeaponState[];
    };
