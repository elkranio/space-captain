// src/engine/encounter/combat/EnemyCrewTaskRunner.ts

import type {
    OfficerRole,
} from '../../../defs/officer';
import {
    doesPointDefensePhaseRequireOperator,
} from '../../../defs/point_defense';
import {
    doesShipWeaponPhaseRequireOperator,
} from '../../../defs/ship_weapon';
import type {
    ShipEncounterActorState,
} from '../../actors/ship/ship_encounter_actor';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../model/combat';
import {
    SHIP_CREW_TASK_KIND,
    type ClearStickyMineShipCrewTaskState,
    type IdentifyThreatShipCrewTaskState,
    type PurgeSpamShipCrewTaskState,
    type ShipCrewTaskState,
} from '../../model/ship_crew_task';
import type {
    EncounterState,
} from '../../model/state';
import CrewPerformanceResolver from '../../crew_performance/CrewPerformanceResolver';
import {
    getActivePlayerSpamChannels,
} from '../queries/get_active_player_spam_channels';

type EnemyCrewTaskRunnerOptions = {
    state: EncounterState;

    onOffensiveTaskCompleted: (
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ) => void;


    onStickyMineClearingCompleted: (
        actor: ShipEncounterActorState,
        mineId: string,
    ) => void;

    onSpamPurgingCompleted: (
        actor: ShipEncounterActorState,
        channelId: string,
    ) => void;

    onThreatIdentificationCompleted: (
        actor: ShipEncounterActorState,
        observationId: string,
    ) => void;
};

// Владеет lifecycle задач абстрактного
// экипажа NPC-кораблей.
//
// Policy и scheduler выбирают работу.
// Этот runner:
// - занимает одну конкретную роль;
// - не допускает параллельные задачи одной роли;
// - двигает timed tasks;
// - отменяет задачи при смерти actor,
//   исчезновении роли или цели;
// - завершает задачу по её физическому lifecycle;
// - сообщает о natural completion владельцу policy.
export default class EnemyCrewTaskRunner {
    private readonly state: EncounterState;

    private readonly performanceResolver:
        CrewPerformanceResolver;

    private readonly onOffensiveTaskCompleted:
        EnemyCrewTaskRunnerOptions[
            'onOffensiveTaskCompleted'
        ];


    private readonly onStickyMineClearingCompleted:
        EnemyCrewTaskRunnerOptions[
            'onStickyMineClearingCompleted'
        ];

    private readonly onSpamPurgingCompleted:
        EnemyCrewTaskRunnerOptions[
            'onSpamPurgingCompleted'
        ];

    private readonly onThreatIdentificationCompleted:
        EnemyCrewTaskRunnerOptions[
            'onThreatIdentificationCompleted'
        ];

    constructor({
        state,
        onOffensiveTaskCompleted,
        onStickyMineClearingCompleted,
        onSpamPurgingCompleted,
        onThreatIdentificationCompleted,
    }: EnemyCrewTaskRunnerOptions) {
        this.state = state;

        this.performanceResolver =
            new CrewPerformanceResolver(
                this.state,
            );

        this.onOffensiveTaskCompleted =
            onOffensiveTaskCompleted;

        this.onStickyMineClearingCompleted =
            onStickyMineClearingCompleted;

        this.onSpamPurgingCompleted =
            onSpamPurgingCompleted;

        this.onThreatIdentificationCompleted =
            onThreatIdentificationCompleted;
    }

    public isRoleBusy(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): boolean {
        return (
            actor.crewTasks[role] !==
            undefined
        );
    }

    public start(
        actor: ShipEncounterActorState,
        task: ShipCrewTaskState,
    ): ShipCrewTaskState {
        if (
            !actor.crewRoles.includes(
                task.role,
            )
        ) {
            throw new Error(
                'Ship crew role is missing: ' +
                    actor.id +
                    '/' +
                    task.role,
            );
        }

        if (
            this.isRoleBusy(
                actor,
                task.role,
            )
        ) {
            throw new Error(
                'Ship crew role already busy: ' +
                    actor.id +
                    '/' +
                    task.role,
            );
        }

        const storedTask: ShipCrewTaskState = {
            ...task,
        };

        actor.crewTasks[task.role] =
            storedTask;

        return storedTask;
    }

    public cancel(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): ShipCrewTaskState | undefined {
        const task =
            actor.crewTasks[role];

        if (!task) {
            return undefined;
        }

        delete actor.crewTasks[role];

        return task;
    }

    public advance(
        deltaMs: number,
    ): void {
        if (deltaMs < 0) {
            throw new Error(
                'Enemy crew task deltaMs ' +
                    'cannot be negative: ' +
                    deltaMs,
            );
        }

        this.processTasks(
            deltaMs,
            true,
        );
    }

    public synchronize(): void {
        this.processTasks(
            0,
            false,
        );
    }

    private processTasks(
        deltaMs: number,
        advanceTimedTasks: boolean,
    ): void {
        for (const actor of this.state.actors) {
            if (actor.hull <= 0) {
                this.cancelAll(actor);
                continue;
            }

            const progressDeltaMs =
                advanceTimedTasks
                    ? deltaMs *
                      this.performanceResolver
                          .getActorProgressMultiplier(
                              actor.id,
                          )
                    : deltaMs;

            const taskRoles =
                Object.keys(
                    actor.crewTasks,
                ) as OfficerRole[];

            for (const role of taskRoles) {
                const task =
                    actor.crewTasks[role];

                if (!task) {
                    continue;
                }

                if (task.role !== role) {
                    throw new Error(
                        'Ship crew task role mismatch: ' +
                            actor.id +
                            '/' +
                            role +
                            '/' +
                            task.role,
                    );
                }

                if (
                    !actor.crewRoles.includes(
                        role,
                    )
                ) {
                    this.cancel(
                        actor,
                        role,
                    );

                    continue;
                }

                this.processTask(
                    actor,
                    role,
                    task,
                    progressDeltaMs,
                    advanceTimedTasks,
                );
            }
        }
    }

    private processTask(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task: ShipCrewTaskState,
        deltaMs: number,
        advanceTimedTasks: boolean,
    ): void {
        switch (task.kind) {
            case SHIP_CREW_TASK_KIND
                .OPERATE_WEAPON:
                this.synchronizeOperateWeapon(
                    actor,
                    role,
                    task.weaponId,
                );

                return;

            case SHIP_CREW_TASK_KIND
                .INTERCEPT_MISSILE:
                this.synchronizeInterceptMissile(
                    actor,
                    role,
                    task.pointDefenseId,
                );

                return;

            case SHIP_CREW_TASK_KIND
                .CLEAR_STICKY_MINE:
                this.processClearStickyMine(
                    actor,
                    role,
                    task,
                    deltaMs,
                    advanceTimedTasks,
                );

                return;

            case SHIP_CREW_TASK_KIND
                .IDENTIFY_THREAT:
                this.processIdentifyThreat(
                    actor,
                    role,
                    task,
                    deltaMs,
                    advanceTimedTasks,
                );

                return;

            case SHIP_CREW_TASK_KIND
                .PURGE_SPAM:
                this.processPurgeSpam(
                    actor,
                    role,
                    task,
                    deltaMs,
                    advanceTimedTasks,
                );

                return;
        }
    }

    private synchronizeOperateWeapon(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        weaponId: string,
    ): void {
        const weapon =
            actor.weapons.find(
                (candidate) => {
                    return (
                        candidate.id ===
                        weaponId
                    );
                },
            );

        if (!weapon) {
            this.cancel(
                actor,
                role,
            );

            return;
        }

        if (
            doesShipWeaponPhaseRequireOperator(
                weapon.phase,
            )
        ) {
            return;
        }

        this.complete(
            actor,
            role,
        );

        this.onOffensiveTaskCompleted(
            actor,
            role,
        );
    }

    private synchronizeInterceptMissile(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        pointDefenseId: string,
    ): void {
        const pointDefense =
            actor.pointDefense;

        if (
            !pointDefense ||
            pointDefense.id !==
                pointDefenseId
        ) {
            this.cancel(
                actor,
                role,
            );

            return;
        }

        if (
            doesPointDefensePhaseRequireOperator(
                pointDefense.phase,
            )
        ) {
            return;
        }

        this.complete(
            actor,
            role,
        );
    }

    private processClearStickyMine(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task:
            ClearStickyMineShipCrewTaskState,
        deltaMs: number,
        advanceTimedTasks: boolean,
    ): void {
        const mine =
            this.state.combat
                .stickyMines
                .find((candidate) => {
                    return (
                        candidate.id ===
                            task.mineId &&
                        candidate.source.kind ===
                            COMBAT_SOURCE_KIND
                                .PLAYER_SHIP &&
                        candidate.target.kind ===
                            COMBAT_TARGET_KIND
                                .ACTOR &&
                        candidate.target.actorId ===
                            actor.id
                    );
                });

        if (!mine) {
            this.cancel(
                actor,
                role,
            );

            return;
        }

        if (!advanceTimedTasks) {
            return;
        }

        task.elapsedMs =
            Math.min(
                task.durationMs,

                task.elapsedMs +
                    deltaMs,
            );

        if (
            task.elapsedMs <
            task.durationMs
        ) {
            return;
        }

        this.onStickyMineClearingCompleted(
            actor,
            task.mineId,
        );

        this.complete(
            actor,
            role,
        );
    }

    private processPurgeSpam(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task:
            PurgeSpamShipCrewTaskState,
        deltaMs: number,
        advanceTimedTasks: boolean,
    ): void {
        const channel =
            getActivePlayerSpamChannels(
                this.state,
            ).find((candidate) => {
                return (
                    candidate.id ===
                        task.channelId &&
                    candidate.targetActorId ===
                        actor.id
                );
            });

        if (!channel) {
            this.cancel(
                actor,
                role,
            );

            return;
        }

        if (!advanceTimedTasks) {
            return;
        }

        task.elapsedMs =
            Math.min(
                task.durationMs,

                task.elapsedMs +
                    deltaMs,
            );

        if (
            task.elapsedMs <
            task.durationMs
        ) {
            return;
        }

        this.onSpamPurgingCompleted(
            actor,
            task.channelId,
        );

        this.complete(
            actor,
            role,
        );
    }

    private processIdentifyThreat(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task:
            IdentifyThreatShipCrewTaskState,
        deltaMs: number,
        advanceTimedTasks: boolean,
    ): void {
        const observation =
            actor
                .threatObservations
                .find((candidate) => {
                    return (
                        candidate.id ===
                        task.observationId
                    );
                });

        if (
            !observation ||
            observation.report
        ) {
            this.cancel(
                actor,
                role,
            );

            return;
        }

        if (!advanceTimedTasks) {
            return;
        }

        task.elapsedMs =
            Math.min(
                task.durationMs,
                task.elapsedMs +
                    deltaMs,
            );

        if (
            task.elapsedMs <
            task.durationMs
        ) {
            return;
        }

        this.onThreatIdentificationCompleted(
            actor,
            task.observationId,
        );

        this.complete(
            actor,
            role,
        );
    }

    private complete(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): ShipCrewTaskState {
        const task =
            this.cancel(
                actor,
                role,
            );

        if (!task) {
            throw new Error(
                'Ship crew task disappeared ' +
                    'before completion: ' +
                    actor.id +
                    '/' +
                    role,
            );
        }

        return task;
    }

    private cancelAll(
        actor: ShipEncounterActorState,
    ): void {
        const taskRoles =
            Object.keys(
                actor.crewTasks,
            ) as OfficerRole[];

        for (const role of taskRoles) {
            this.cancel(
                actor,
                role,
            );
        }
    }

}
