// src/engine/encounter/combat/EnemyTaskScheduler.ts

import {
    OFFICER_TASK_BASE_DURATION_MS,
} from '../../content/rules/officer_tasks';
import {
    ENCOUNTER_TEAM,
} from '../../defs/encounter_team';
import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../defs/player_location';
import {
    SHIP_WEAPON_PHASE,
} from '../../defs/ship_weapon';
import type {
    ShipEncounterActorState,
} from '../actors/ship/ship_encounter_actor';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../model/event';
import {
    ENEMY_THREAT_KIND,
} from '../model/enemy_threat_observation';
import {
    SHIP_CREW_TASK_KIND,
} from '../model/ship_crew_task';
import type {
    EncounterState,
} from '../model/state';
import EnemyCrewTaskRunner from './EnemyCrewTaskRunner';
import EnemyDecisionPolicy from './EnemyDecisionPolicy';
import EnemyScienceIntelResolver from './EnemyScienceIntelResolver';

type EnemyTaskSchedulerOptions = {
    state: EncounterState;

    emit: (event: EncounterEvent) => void;
};

const WEAPON_TASK_ROLES = [
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.SCIENCE,
] as const;

// Назначает выбранные policy задачи
// на ограниченные роли вражеского экипажа.
//
// Priority внутри одной роли:
// Science intel → offensive weapon work.
//
// Scheduler только:
// - выбирает доступную работу;
// - просит task runner занять роль;
// - запускает физический targeting оружия;
// - эмитит видимый telegraph.
//
// Lifecycle crew tasks живёт
// в EnemyCrewTaskRunner.
// Objective truth → report boundary
// живёт в EnemyScienceIntelResolver.
export default class EnemyTaskScheduler {
    private readonly state: EncounterState;

    private readonly emit:
        (event: EncounterEvent) => void;

    private readonly decisionPolicy =
        new EnemyDecisionPolicy();

    private readonly scienceIntelResolver:
        EnemyScienceIntelResolver;

    private readonly crewTaskRunner:
        EnemyCrewTaskRunner;

    constructor({
        state,
        emit,
    }: EnemyTaskSchedulerOptions) {
        this.state = state;
        this.emit = emit;

        this.scienceIntelResolver =
            new EnemyScienceIntelResolver(
                this.state,
            );

        this.crewTaskRunner =
            new EnemyCrewTaskRunner({
                state: this.state,

                onOffensiveTaskCompleted:
                    (actor, role) => {
                        this.decisionPolicy
                            .onOffensiveTaskCompleted(
                                actor,
                                role,
                            );
                    },

                onThreatIdentificationCompleted:
                    (
                        actor,
                        observationId,
                    ) => {
                        const observation =
                            actor
                                .threatObservations
                                .find(
                                    (
                                        candidate,
                                    ) => {
                                        return (
                                            candidate
                                                .id ===
                                            observationId
                                        );
                                    },
                                );

                        if (!observation) {
                            throw new Error(
                                'Enemy threat ' +
                                    'observation ' +
                                    'disappeared before ' +
                                    'report: ' +
                                    actor.id +
                                    '/' +
                                    observationId,
                            );
                        }

                        observation.report =
                            this
                                .scienceIntelResolver
                                .resolve(
                                    actor,
                                    observationId,
                                );
                    },
            });
    }

    public schedule(deltaMs: number): void {
        this.crewTaskRunner
            .advance(deltaMs);

        this.advanceDecisions(deltaMs);

        const navigation =
            this.state.navigation;

        if (
            navigation.kind !==
            PLAYER_SPACE_NAVIGATION_KIND
                .ANCHORED
        ) {
            return;
        }

        for (const actor of this.state.actors) {
            if (
                actor.team !==
                ENCOUNTER_TEAM.ENEMY
            ) {
                continue;
            }

            if (actor.hull <= 0) {
                continue;
            }

            if (
                actor.anchorId !==
                navigation.anchorId
            ) {
                continue;
            }

            this.scheduleScienceIdentification(
                actor,
            );

            for (
                const role of WEAPON_TASK_ROLES
            ) {
                if (
                    !this.hasCrewRole(
                        actor,
                        role,
                    )
                ) {
                    continue;
                }

                this.scheduleRole(
                    actor,
                    role,
                );
            }
        }
    }

    public synchronizeTasks(): void {
        this.crewTaskRunner
            .synchronize();
    }

    private advanceDecisions(
        deltaMs: number,
    ): void {
        for (const actor of this.state.actors) {
            if (
                actor.team !==
                ENCOUNTER_TEAM.ENEMY
            ) {
                continue;
            }

            if (actor.hull <= 0) {
                continue;
            }

            this.decisionPolicy.advance(
                actor,
                deltaMs,
            );
        }
    }

    private scheduleScienceIdentification(
        actor: ShipEncounterActorState,
    ): void {
        if (
            !this.hasCrewRole(
                actor,
                OFFICER_ROLE.SCIENCE,
            ) ||
            this.crewTaskRunner
                .isRoleBusy(
                    actor,
                    OFFICER_ROLE.SCIENCE,
                )
        ) {
            return;
        }

        const observation =
            actor
                .threatObservations
                .find((candidate) => {
                    return (
                        candidate.report ===
                            undefined &&
                        (
                            candidate.kind ===
                                ENEMY_THREAT_KIND
                                    .MISSILE ||
                            candidate.kind ===
                                ENEMY_THREAT_KIND
                                    .LASER
                        )
                    );
                });

        if (!observation) {
            return;
        }

        this.crewTaskRunner.start(
            actor,
            {
                kind:
                    SHIP_CREW_TASK_KIND
                        .IDENTIFY_THREAT,

                role:
                    OFFICER_ROLE.SCIENCE,

                observationId:
                    observation.id,

                elapsedMs: 0,

                durationMs:
                    OFFICER_TASK_BASE_DURATION_MS
                        .SCIENCE_IDENTIFY_THREAT,
            },
        );
    }

    private scheduleRole(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): void {
        if (
            this.crewTaskRunner
                .isRoleBusy(
                    actor,
                    role,
                )
        ) {
            return;
        }

        const weapon =
            this.decisionPolicy.selectWeapon(
                actor,
                role,
            );

        if (!weapon) {
            return;
        }

        this.crewTaskRunner.start(
            actor,
            {
                kind:
                    SHIP_CREW_TASK_KIND
                        .OPERATE_WEAPON,

                role,

                weaponId: weapon.id,
            },
        );

        weapon.phase =
            SHIP_WEAPON_PHASE.TARGETING;
        weapon.phaseElapsedMs = 0;

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_SHIP_TARGETING_DETECTED,

            sourceActorId: actor.id,
            sourceWeaponId: weapon.id,
        });
    }

    private hasCrewRole(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): boolean {
        return actor.crewRoles.includes(role);
    }
}
