// src/engine/encounter/actors/ship/ship_encounter_actor.ts

import type { ShipId } from '../../../defs/ship';
import { ENCOUNTER_ACTOR_KIND, type EncounterActorBaseState } from '../encounter_actor';

// Runtime-состояние конкретного корабля
// внутри текущего encounter.
//
// shipId указывает на стабильный ShipDefinition.
// id остаётся runtime id конкретного экземпляра.
export type ShipEncounterActorState = EncounterActorBaseState & {
    kind: typeof ENCOUNTER_ACTOR_KIND.SHIP;

    shipId: ShipId;
};
