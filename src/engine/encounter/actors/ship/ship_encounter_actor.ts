// src/engine/encounter/actors/ship/ship_encounter_actor.ts

import type { CrewTraitsByRole } from "../../../defs/crew_trait";
import type { PowerCoreState } from "../../../defs/power_core";
import type { OfficerRole } from "../../../defs/officer";
import type { ShipDefenseTurretState } from "../../../defs/defense_turret";
import type { ShipBehaviorState } from "../../../defs/ship_behavior";
import type { ShipChassisId } from "../../../defs/ship_chassis";
import type { ShipDriveState } from "../../../defs/ship_drive";
import type { ShipEvadeState } from "../../../defs/ship_evade";
import type { ShipWeaponState } from "../../../defs/ship_weapon";
import type { ShieldGeneratorState } from "../../../defs/shield_generator";
import type { ActiveShieldState } from "../../model/combat";
import type { EnemyThreatObservationState } from "../../model/enemy_threat_observation";
import type { ShipCrewTaskStates } from "../../model/ship_crew_task";
import type { ShipDecisionState } from "../../model/ship_decision";
import { ENCOUNTER_ACTOR_KIND, type EncounterActorBaseState } from "../encounter_actor";

// Runtime-состояние конкретного корабля
// внутри текущего encounter.
//
// chassisId указывает
// на стабильный ShipChassisDefinition.
// id остаётся runtime id конкретного экземпляра.
export type ShipEncounterActorState = EncounterActorBaseState & {
    kind: typeof ENCOUNTER_ACTOR_KIND.SHIP;

    chassisId: ShipChassisId;

    hull: number;
    maxHull: number;

    drive: ShipDriveState;

    // Encounter-local maneuver state shared by player/enemy ship logic.
    evade: ShipEvadeState;

    defenseTurret?: ShipDefenseTurretState;

    powerCore?: PowerCoreState;

    shieldGenerator?: ShieldGeneratorState;

    activeShield?: ActiveShieldState;

    behavior: ShipBehaviorState;

    // Абстрактные роли,
    // физически доступные этому экипажу.
    crewRoles: OfficerRole[];

    // Persistent traits конкретных ролей.
    // Encounter получает независимую копию.
    crewTraitsByRole: CrewTraitsByRole;

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

    // Одноразовое opening action этого ship
    // внутри текущего encounter.
    hasUsedOpeningDisruptionPulse: boolean;

    // Mutable loadout
    // только текущего encounter.
    weapons: ShipWeaponState[];
};
