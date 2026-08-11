// src/engine/encounter/state/actors/EncounterActorStore.ts

import { SHIP_CHASSIS } from '../../../content/catalogs/ship_chassis';
import type {
    CrewTraitsByRole,
} from '../../../defs/crew_trait';
import type {
    DefenseCapacitorState,
} from '../../../defs/defense_capacitor';
import {
    ENCOUNTER_TEAM,
    type EncounterTeam,
} from '../../../defs/encounter_team';
import type {
    OfficerRole,
} from '../../../defs/officer';
import type {
    ShipPointDefenseState,
} from '../../../defs/point_defense';
import type {
    ShipBehaviorState,
} from '../../../defs/ship_behavior';
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
    type EncounterActorState,
} from '../../actors/encounter_actor';
import type {
    ShipEncounterActorState,
} from '../../actors/ship/ship_encounter_actor';
import type {
    EncounterState,
} from '../../model/state';

export type EnemyHullDamageResult = {
    appliedDamage: number;
    remainingHull: number;
    destroyed: boolean;
};

export type SpawnShipActorInput = {
    actorId: string;
    chassisId: ShipChassisId;
    anchorId: string;

    team: EncounterTeam;

    hull: number;
    maxHull: number;

    drive: ShipDriveState;

    pointDefense?:
        ShipPointDefenseState;

    defenseCapacitor?:
        DefenseCapacitorState;

    behavior: ShipBehaviorState;

    crewRoles: OfficerRole[];
    crewTraitsByRole?:
        CrewTraitsByRole;

    weapons: ShipWeaponState[];
};

// Owns encounter actor lookup and mutation rules.
export default class EncounterActorStore {
    constructor(
        private readonly state: EncounterState,
    ) {}

    public findActorById(
        actorId: string | undefined,
    ): EncounterActorState | undefined {
        if (!actorId) {
            return undefined;
        }

        return this.state.actors
            .find((actor) => {
                return actor.id ===
                    actorId;
            });
    }

    public getActorsAtAnchor(
        anchorId: string,
    ): EncounterActorState[] {
        return this.state.actors
            .filter((actor) => {
                return actor.anchorId ===
                    anchorId;
            });
    }

    public spawnShipActor({
        actorId,
        chassisId,
        anchorId,
        team,
        hull,
        maxHull,
        drive,
        pointDefense,
        defenseCapacitor,        behavior,
        crewRoles,
        crewTraitsByRole = {},
        weapons,
    }: SpawnShipActorInput):
        ShipEncounterActorState {
        if (
            !this.state.anchors
                .some((anchor) => {
                    return anchor.id ===
                        anchorId;
                })
        ) {
            throw new Error(
                `Cannot spawn ship actor: ` +
                    `anchor not found: ${anchorId}`,
            );
        }

        if (
            this.findActorById(
                actorId,
            )
        ) {
            throw new Error(
                `Encounter actor already exists: ${actorId}`,
            );
        }

        const ship =
            SHIP_CHASSIS[chassisId];

        const copiedCrewTraitsByRole:
            CrewTraitsByRole = {};

        for (const role of crewRoles) {
            copiedCrewTraitsByRole[role] = [
                ...(
                    crewTraitsByRole[
                        role
                    ] ??
                    []
                ),
            ];
        }

        const actor:
            ShipEncounterActorState = {
            id: actorId,
            kind:
                ENCOUNTER_ACTOR_KIND.SHIP,
            displayName: ship.name,

            team,

            anchorId,
            chassisId,

            hull,
            maxHull,

            drive: {
                ...drive,
            },

            ...(
                pointDefense
                    ? {
                          pointDefense: {
                              ...pointDefense,
                          },
                      }
                    : {}
            ),

            ...(
                defenseCapacitor
                    ? {
                          defenseCapacitor: {
                              ...defenseCapacitor,
                          },
                      }
                    : {}
            ),

            behavior: {
                ...behavior,
            },

            crewRoles: [
                ...crewRoles,
            ],

            crewTraitsByRole:
                copiedCrewTraitsByRole,

            decision: {
                nextWeaponIndexByRole: {},

                offensiveTaskDelayRemainingMsByRole:
                    {},
            },

            crewTasks: {},

            threatObservations: [],

            hasUsedOpeningDisruptionPulse:
                false,

            weapons:
                weapons.map((weapon) => {
                    return {
                        ...weapon,
                    };
                }),
        };

        this.state.actors.push(
            actor,
        );

        return actor;
    }

    public removeActor(
        actorId: string,
    ): EncounterActorState {
        const actorIndex =
            this.state.actors
                .findIndex((actor) => {
                    return (
                        actor.id ===
                        actorId
                    );
                });

        if (actorIndex < 0) {
            throw new Error(
                'Encounter actor not found: ' +
                    actorId,
            );
        }

        const actor =
            this.state.actors[
                actorIndex
            ];

        if (!actor) {
            throw new Error(
                'Encounter actor disappeared ' +
                    'before removal: ' +
                    actorId,
            );
        }

        this.state.actors.splice(
            actorIndex,
            1,
        );

        for (
            let index =
                this.state.combat
                    .laserAttacks
                    .length - 1;

            index >= 0;

            index -= 1
        ) {
            const attack =
                this.state.combat
                    .laserAttacks[
                        index
                    ];

            if (
                attack?.sourceActorId !==
                actorId
            ) {
                continue;
            }

            this.state.combat
                .laserAttacks.splice(
                    index,
                    1,
                );
        }

        return actor;
    }

    public setActorTeam(
        actorId: string,
        team: EncounterTeam,
    ): ShipEncounterActorState {
        const actor =
            this.findActorById(
                actorId,
            );

        if (!actor) {
            throw new Error(
                `Encounter actor not found: ${actorId}`,
            );
        }

        actor.team = team;

        return actor;
    }

    public damageEnemyActorHull(
        actorId: string,
        damage: number,
    ): EnemyHullDamageResult {
        if (
            !Number.isFinite(damage) ||
            damage < 0
        ) {
            throw new Error(
                'Invalid enemy hull damage: ' +
                    String(damage),
            );
        }

        const actor =
            this.findActorById(
                actorId,
            );

        if (!actor) {
            throw new Error(
                'Enemy actor not found for hull damage: ' +
                    actorId,
            );
        }

        if (
            actor.team !==
            ENCOUNTER_TEAM.ENEMY
        ) {
            throw new Error(
                'Cannot damage non-enemy actor hull: ' +
                    actorId +
                    '/' +
                    actor.team,
            );
        }

        if (actor.hull <= 0) {
            throw new Error(
                'Cannot damage destroyed enemy actor hull: ' +
                    actorId,
            );
        }

        const appliedDamage =
            Math.min(
                damage,
                actor.hull,
            );

        actor.hull = Math.max(
            0,
            actor.hull -
                appliedDamage,
        );

        return {
            appliedDamage,

            remainingHull:
                actor.hull,

            destroyed:
                appliedDamage > 0 &&
                actor.hull === 0,
        };
    }

    public consumeOpeningDisruptionPulse(
        actorId: string,
    ): ShipEncounterActorState | undefined {
        const actor =
            this.findActorById(
                actorId,
            );

        if (!actor) {
            throw new Error(
                `Encounter actor not found: ${actorId}`,
            );
        }

        if (
            actor.hasUsedOpeningDisruptionPulse
        ) {
            return undefined;
        }

        actor.hasUsedOpeningDisruptionPulse =
            true;

        return actor;
    }
}
