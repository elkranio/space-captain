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
    SHIP_CREW_TASK_KIND,
} from '../model/ship_crew_task';
import type {
    EncounterState,
} from '../model/state';
import EnemyCrewTaskRunner from './EnemyCrewTaskRunner';
import EnemyDecisionPolicy, {
    type EnemyWorkIntent,
} from './EnemyDecisionPolicy';
import EnemyScienceIntelResolver from './EnemyScienceIntelResolver';

type EnemyTaskSchedulerOptions = {
    state: EncounterState;

    emit: (event: EncounterEvent) => void;
};

const ENEMY_WORK_ROLES = [
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.SCIENCE,
] as const;

// Исполняет выбранные policy задачи
// через ограниченные роли вражеского экипажа.
//
// Scheduler только:
// - проверяет наличие и занятость роли;
// - запрашивает один intent у policy;
// - валидирует физическую цель intent;
// - просит task runner занять роль;
// - запускает targeting оружия;
// - эмитит видимый telegraph.
//
// Strategic priorities и выбор цели
// принадлежат EnemyDecisionPolicy.
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

            for (
                const role of
                ENEMY_WORK_ROLES
            ) {
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

    private scheduleRole(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): void {
        if (
            !this.hasCrewRole(
                actor,
                role,
            ) ||
            this.crewTaskRunner
                .isRoleBusy(
                    actor,
                    role,
                )
        ) {
            return;
        }

        const intent =
            this.decisionPolicy
                .selectWork(
                    actor,
                    role,
                );

        if (!intent) {
            return;
        }

        this.startWork(
            actor,
            intent,
        );
    }

    private startWork(
        actor: ShipEncounterActorState,
        intent: EnemyWorkIntent,
    ): void {
        switch (intent.kind) {
            case SHIP_CREW_TASK_KIND
                .IDENTIFY_THREAT:
                this.startThreatIdentification(
                    actor,
                    intent,
                );

                return;

            case SHIP_CREW_TASK_KIND
                .OPERATE_WEAPON:
                this.startWeaponOperation(
                    actor,
                    intent,
                );

                return;
        }
    }

    private startThreatIdentification(
        actor: ShipEncounterActorState,
        intent:
            Extract<
                EnemyWorkIntent,
                {
                    kind:
                        typeof SHIP_CREW_TASK_KIND
                            .IDENTIFY_THREAT;
                }
            >,
    ): void {
        const observation =
            actor
                .threatObservations
                .find((candidate) => {
                    return (
                        candidate.id ===
                        intent.observationId
                    );
                });

        if (
            !observation ||
            observation.report
        ) {
            throw new Error(
                'Cannot start enemy threat ' +
                    'identification: ' +
                    actor.id +
                    '/' +
                    intent.observationId,
            );
        }

        this.crewTaskRunner.start(
            actor,
            {
                ...intent,

                elapsedMs: 0,

                durationMs:
                    OFFICER_TASK_BASE_DURATION_MS
                        .SCIENCE_IDENTIFY_THREAT,
            },
        );
    }

    private startWeaponOperation(
        actor: ShipEncounterActorState,
        intent:
            Extract<
                EnemyWorkIntent,
                {
                    kind:
                        typeof SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON;
                }
            >,
    ): void {
        const weapon =
            actor.weapons.find((candidate) => {
                return (
                    candidate.id ===
                    intent.weaponId
                );
            });

        if (
            !weapon ||
            weapon.phase !==
                SHIP_WEAPON_PHASE.READY
        ) {
            throw new Error(
                'Cannot start enemy weapon work: ' +
                    actor.id +
                    '/' +
                    intent.role +
                    '/' +
                    intent.weaponId,
            );
        }

        this.crewTaskRunner.start(
            actor,
            intent,
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
