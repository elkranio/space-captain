// src/engine/encounter/combat/EnemyTaskScheduler.ts

import {
    ENCOUNTER_TEAM,
} from '../../../defs/encounter_team';
import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../../defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../defs/player_location';
import type {
    ShipEncounterActorState,
} from '../../actors/ship/ship_encounter_actor';
import {
    getActiveCrewProgressEffects,
} from '../../crew_performance/get_active_crew_progress_effects';
import type {
    EncounterEvent,
} from '../../model/event';
import type {
    EncounterState,
} from '../../model/state';
import {
    getEnemyThreatDecisionSnapshots,
} from '../queries/get_enemy_threat_decision_snapshots';
import EnemyCrewTaskRunner from './EnemyCrewTaskRunner';
import EnemyDecisionPolicy, {
    type EnemyDecisionContext,
} from './EnemyDecisionPolicy';
import EnemyScienceIntelResolver from './intel/EnemyScienceIntelResolver';
import EnemyWorkExecutor from './EnemyWorkExecutor';

type EnemyTaskSchedulerOptions = {
    state: EncounterState;

    emit: (event: EncounterEvent) => void;

    clearPlayerStickyMine: (
        mineId: string,
        targetActorId: string,
    ) => boolean;

    purgePlayerSpamChannel: (
        channelId: string,
        targetActorId: string,
    ) => boolean;

    deployEnemyShield?: (
        actor: ShipEncounterActorState,
    ) => void;

    random?: () => number;
};

const ENEMY_WORK_ROLES = [
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.ENGINEER,
] as const;

// Transitional enemy work-selection loop.
//
// Пока сохраняет старое gameplay:
// - двигает crew tasks и legacy policy timers;
// - собирает decision context;
// - спрашивает старую per-role policy;
// - передаёт выбранный intent в EnemyWorkExecutor.
//
// Physical validation/start здесь больше не живёт.
// Этот scheduler будет удалён следующим cleanup-срезом,
// когда EnemyBehaviorRunner заменит старый per-role loop.
//
// Lifecycle crew tasks живёт в EnemyCrewTaskRunner.
// Objective truth → report boundary живёт
// в EnemyScienceIntelResolver.
export default class EnemyTaskScheduler {
    private readonly state: EncounterState;

    private readonly decisionPolicy:
        EnemyDecisionPolicy;

    private readonly scienceIntelResolver:
        EnemyScienceIntelResolver;

    private readonly crewTaskRunner:
        EnemyCrewTaskRunner;

    private readonly workExecutor:
        EnemyWorkExecutor;

    constructor({
        state,
        emit,
        clearPlayerStickyMine,
        purgePlayerSpamChannel,
        deployEnemyShield,
        random = Math.random,
    }: EnemyTaskSchedulerOptions) {
        this.state = state;

        this.decisionPolicy =
            new EnemyDecisionPolicy();

        this.scienceIntelResolver =
            new EnemyScienceIntelResolver(
                this.state,
                random,
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

                onShieldDeploymentCompleted:
                    (actor) => {
                        if (!deployEnemyShield) {
                            throw new Error(
                                'Enemy shield deployment callback is missing',
                            );
                        }

                        deployEnemyShield(
                            actor,
                        );
                    },

                onStickyMineClearingCompleted:
                    (
                        actor,
                        mineId,
                    ) => {
                        const cleared =
                            clearPlayerStickyMine(
                                mineId,
                                actor.id,
                            );

                        if (!cleared) {
                            throw new Error(
                                'Enemy sticky mine ' +
                                    'disappeared before ' +
                                    'clearing completion: ' +
                                    actor.id +
                                    '/' +
                                    mineId,
                            );
                        }
                    },

                onSpamPurgingCompleted:
                    (
                        actor,
                        channelId,
                    ) => {
                        const purged =
                            purgePlayerSpamChannel(
                                channelId,
                                actor.id,
                            );

                        if (!purged) {
                            throw new Error(
                                'Player spam channel ' +
                                    'disappeared before ' +
                                    'enemy purge completion: ' +
                                    actor.id +
                                    '/' +
                                    channelId,
                            );
                        }
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

        this.workExecutor =
            new EnemyWorkExecutor({
                state: this.state,
                emit,
                crewTaskRunner:
                    this.crewTaskRunner,
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

        const crewProgressEffects =
            getActiveCrewProgressEffects(
                this.state,
            );

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

            const decisionContext:
                EnemyDecisionContext = {
                    threats:
                        getEnemyThreatDecisionSnapshots(
                            this.state,
                            actor,
                        ),

                    crewProgressEffects,
                };

            this.scheduleMineClearing(
                actor,
                decisionContext,
            );

            for (
                const role of
                ENEMY_WORK_ROLES
            ) {
                this.scheduleRole(
                    actor,
                    role,
                    decisionContext,
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
        decisionContext:
            EnemyDecisionContext,
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
                    decisionContext,
                );

        if (!intent) {
            return;
        }

        this.workExecutor.start(
            actor,
            intent,
        );
    }

    private scheduleMineClearing(
        actor: ShipEncounterActorState,
        decisionContext:
            EnemyDecisionContext,
    ): void {
        while (true) {
            const intent =
                this.decisionPolicy
                    .selectMineClearing(
                        actor,
                        decisionContext,
                    );

            if (!intent) {
                return;
            }

            this.workExecutor.start(
                actor,
                intent,
            );
        }
    }

    private hasCrewRole(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): boolean {
        return actor.crewRoles.includes(role);
    }
}
