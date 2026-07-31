// src/engine/encounter/actors/ship/ship_encounter_actor.ts

import type { ShipId } from '../../../defs/ship';
import type { ShipWeaponState } from '../../../defs/ship_weapon';
import { ENCOUNTER_ACTOR_KIND, type EncounterActorBaseState } from '../encounter_actor';

// Runtime-состояние конкретного корабля
// внутри текущего encounter.
//
// shipId указывает на стабильный ShipDefinition.
// id остаётся runtime id конкретного экземпляра.
export type ShipEncounterActorState = EncounterActorBaseState & {
    kind: typeof ENCOUNTER_ACTOR_KIND.SHIP;

    shipId: ShipId;

    // Одноразовое opening action этого ship
    // внутри текущего encounter.
    hasUsedOpeningDisruptionPulse: boolean;

    // Mutable loadout только текущего encounter.
    weapons: ShipWeaponState[];
};
