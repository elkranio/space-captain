// src/engine/encounter/actors/ship_encounter_actor.ts

import type { PowerCoreState } from "../../defs/power_core";
import type { OfficerRole } from "../../defs/officer";
import type { ShipBehaviorState } from "../../defs/ship_behavior";
import type { ShipEvadeState } from "../../defs/ship_evade";
import type { ShipEquipmentMountState } from "../../defs/ship_slot";
import type { ActiveShieldState } from "../model/combat";
import type {
    EncounterShieldGeneratorState,
    EncounterShipDefenseTurretState,
    EncounterShipDriveState,
    EncounterShipWeaponState,
} from "../model/equipment";
import type { EnemyThreatObservationState } from "../model/enemy_threat_observation";
import type { ShipCrewTaskStates } from "../model/ship_crew_task";
import type { ShipDecisionState } from "../model/ship_decision";
import { ENCOUNTER_ACTOR_KIND, type EncounterActorBaseState } from "./encounter_actor";

// Runtime-состояние конкретного корабля
// внутри текущего encounter.
//
// chassisId указывает
// на стабильный ShipChassisDefinition.
// id остаётся runtime id конкретного экземпляра.
export type ShipEncounterActorState = EncounterActorBaseState & {
    kind: typeof ENCOUNTER_ACTOR_KIND.SHIP;

    chassisId: string;

    hull: number;
    maxHull: number;

    mounts: ShipEquipmentMountState[];

    drive: EncounterShipDriveState;

    // Encounter-local maneuver state shared by player/enemy ship logic.
    evade: ShipEvadeState;

    defenseTurret?: EncounterShipDefenseTurretState;

    powerCore?: PowerCoreState;

    shieldGenerator?: EncounterShieldGeneratorState;

    activeShield?: ActiveShieldState;

    behavior: ShipBehaviorState;

    // Абстрактные роли,
    // физически доступные этому экипажу.
    crewRoles: OfficerRole[];

    // Mutable captain cadence текущего encounter.
    // Persistent universe state её не хранит.
    decision: ShipDecisionState;

    // Абстрактные задачи экипажа NPC-корабля.
    // Persistent universe state их не хранит.
    crewTasks: ShipCrewTaskStates;

    // Наблюдаемые incoming threats.
    // Объективные параметры остаются
    // в authoritative combat objects/tasks.
    threatObservations: EnemyThreatObservationState[];

    // Mutable loadout
    // только текущего encounter.
    weapons: EncounterShipWeaponState[];
};
