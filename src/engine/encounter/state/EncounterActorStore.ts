// src/engine/encounter/state/EncounterActorStore.ts

import { DEFENSE_TURRETS } from "../../content/catalogs/defense_turrets";
import { SHIELD_GENERATORS } from "../../content/catalogs/shield_generators";
import { SHIP_CHASSIS } from "../../content/catalogs/ship_chassis";
import { SHIP_DRIVES } from "../../content/catalogs/ship_drives";
import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import type { PowerCoreState } from "../../defs/power_core";
import { ENCOUNTER_TEAM, type EncounterTeam } from "../../defs/encounter_team";
import type { OfficerRole } from "../../defs/officer";
import type { ShipDefenseTurretState } from "../../defs/defense_turret";
import type { ShipBehaviorState } from "../../defs/ship_behavior";
import type { ShipEquipmentMountState } from "../../defs/ship_slot";

import { SHIP_DRIVE_STATUS, type ShipDriveState } from "../../defs/ship_drive";
import {
    advanceShipEvade,
    createReadyShipEvadeState,
    SHIP_EVADE_PHASE,
    startShipEvade,
} from "../../defs/ship_evade";
import type { ShipWeaponState } from "../../defs/ship_weapon";
import {
    SHIELD_GENERATOR_STATUS,
    type ShieldGeneratorState,
} from "../../defs/shield_generator";
import { ENCOUNTER_ACTOR_KIND, type EncounterActorState } from "../actors/encounter_actor";
import type { ShipEncounterActorState } from "../actors/ship_encounter_actor";
import { createEncounterEquipmentState } from "../model/equipment";
import type { EncounterState } from "../model/state";

export type EnemyHullDamageResult = {
    appliedDamage: number;
    remainingHull: number;
    destroyed: boolean;
};

export type SpawnShipActorInput = {
    actorId: string;
    chassisId: string;
    anchorId: string;

    team: EncounterTeam;

    hull: number;
    maxHull: number;

    mounts?: ShipEquipmentMountState[];

    drive: ShipDriveState;

    defenseTurret?: ShipDefenseTurretState;

    powerCore?: PowerCoreState;

    shieldGenerator?: ShieldGeneratorState;

    behavior: ShipBehaviorState;

    crewRoles: OfficerRole[];

    weapons: ShipWeaponState[];
};

// Owns encounter actor lookup and mutation rules.
export default class EncounterActorStore {
    constructor(private readonly state: EncounterState) {}

    public findActorById(actorId: string | undefined): EncounterActorState | undefined {
        if (!actorId) {
            return undefined;
        }

        return this.state.actors.find((actor) => {
            return actor.id === actorId;
        });
    }

    public getActorsAtAnchor(anchorId: string): EncounterActorState[] {
        return this.state.actors.filter((actor) => {
            return actor.anchorId === anchorId;
        });
    }

    public spawnShipActor({
        actorId,
        chassisId,
        anchorId,
        team,
        hull,
        maxHull,
        mounts = [],
        drive,
        defenseTurret,
        powerCore,
        shieldGenerator,
        behavior,
        crewRoles,
        weapons,
    }: SpawnShipActorInput): ShipEncounterActorState {
        if (
            !this.state.anchors.some((anchor) => {
                return anchor.id === anchorId;
            })
        ) {
            throw new Error(`Cannot spawn ship actor: ` + `anchor not found: ${anchorId}`);
        }

        if (this.findActorById(actorId)) {
            throw new Error(`Encounter actor already exists: ${actorId}`);
        }

        const ship = SHIP_CHASSIS[chassisId];

        const actor: ShipEncounterActorState = {
            id: actorId,
            kind: ENCOUNTER_ACTOR_KIND.SHIP,
            displayName: ship.name,

            team,

            anchorId,
            chassisId,

            hull,
            maxHull,

            mounts: mounts.map((mount) => ({ ...mount })),

            drive: createEncounterEquipmentState(
                drive,
                SHIP_DRIVES[drive.driveId].maxIntegrity,
                drive.status !== SHIP_DRIVE_STATUS.DISABLED,
            ),

            evade: createReadyShipEvadeState(),

            ...(defenseTurret
                ? {
                      defenseTurret: createEncounterEquipmentState(
                          defenseTurret,
                          DEFENSE_TURRETS[defenseTurret.defenseTurretId].maxIntegrity,
                      ),
                  }
                : {}),

            ...(powerCore
                ? {
                      powerCore: {
                          ...powerCore,
                      },
                  }
                : {}),

            ...(shieldGenerator
                ? {
                      shieldGenerator: createEncounterEquipmentState(
                          shieldGenerator,
                          SHIELD_GENERATORS[shieldGenerator.shieldGeneratorId].maxIntegrity,
                          shieldGenerator.status !== SHIELD_GENERATOR_STATUS.BROKEN,
                      ),
                  }
                : {}),

            behavior: {
                ...behavior,
            },

            crewRoles: [...crewRoles],

            decision: {
                decisionTickRemainingMs: 0,
            },

            crewTasks: {},

            threatObservations: [],

            weapons: weapons.map((weapon) => {
                return createEncounterEquipmentState(
                    weapon,
                    SHIP_WEAPONS[weapon.weaponId].maxIntegrity,
                );
            }),
        };

        this.state.actors.push(actor);

        return actor;
    }

    public removeActor(actorId: string): EncounterActorState {
        const actorIndex = this.state.actors.findIndex((actor) => {
            return actor.id === actorId;
        });

        if (actorIndex < 0) {
            throw new Error("Encounter actor not found: " + actorId);
        }

        const actor = this.state.actors[actorIndex];

        if (!actor) {
            throw new Error("Encounter actor disappeared " + "before removal: " + actorId);
        }

        this.state.actors.splice(actorIndex, 1);

        for (let index = this.state.combat.beamCannonAttacks.length - 1; index >= 0; index -= 1) {
            const attack = this.state.combat.beamCannonAttacks[index];

            if (attack?.sourceActorId !== actorId) {
                continue;
            }

            this.state.combat.beamCannonAttacks.splice(index, 1);
        }

        return actor;
    }

    public setActorTeam(actorId: string, team: EncounterTeam): ShipEncounterActorState {
        const actor = this.findActorById(actorId);

        if (!actor) {
            throw new Error(`Encounter actor not found: ${actorId}`);
        }

        actor.team = team;

        return actor;
    }

    public tryStartActorEvade(actorId: string): boolean {
        const actor = this.findActorById(actorId);

        if (!actor) {
            throw new Error("Encounter actor not found: " + actorId);
        }

        if (actor.drive.status !== SHIP_DRIVE_STATUS.ONLINE || actor.evade.phase !== SHIP_EVADE_PHASE.READY) {
            return false;
        }

        startShipEvade(actor.evade, SHIP_DRIVES[actor.drive.driveId]);

        return true;
    }

    public advanceActorEvades(deltaMs: number): void {
        for (const actor of this.state.actors) {
            advanceShipEvade(actor.evade, SHIP_DRIVES[actor.drive.driveId], deltaMs);
        }
    }

    public damageEnemyActorHull(actorId: string, damage: number): EnemyHullDamageResult {
        if (!Number.isFinite(damage) || damage < 0) {
            throw new Error("Invalid enemy hull damage: " + String(damage));
        }

        const actor = this.findActorById(actorId);

        if (!actor) {
            throw new Error("Enemy actor not found for hull damage: " + actorId);
        }

        if (actor.team !== ENCOUNTER_TEAM.ENEMY) {
            throw new Error("Cannot damage non-enemy actor hull: " + actorId + "/" + actor.team);
        }

        if (actor.hull <= 0) {
            throw new Error("Cannot damage destroyed enemy actor hull: " + actorId);
        }

        const appliedDamage = Math.min(damage, actor.hull);

        actor.hull = Math.max(0, actor.hull - appliedDamage);

        return {
            appliedDamage,

            remainingHull: actor.hull,

            destroyed: appliedDamage > 0 && actor.hull === 0,
        };
    }
}
