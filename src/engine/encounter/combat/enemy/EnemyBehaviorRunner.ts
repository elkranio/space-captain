// src/engine/encounter/combat/enemy/EnemyBehaviorRunner.ts

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
import EnemyThreatObserver from './intel/EnemyThreatObserver';
import EnemyWorkExecutor from './EnemyWorkExecutor';

type EnemyBehaviorRunnerOptions = {
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

// Root runtime owner of enemy combat behavior.
//
// CombatRunner gives this root one behavior step after
// authoritative player combat objects have resolved.
//
// This runner owns:
// - threat perception synchronization;
// - enemy crew-task progress;
// - enemy decision orchestration;
// - intent execution wiring.
//
// Physical weapon/turret/shield lifecycles remain CombatRunner-owned.
// The per-role policy loop below is legacy and will be replaced by
// captain cadence + one-intent decision flow in the next behavior slice.
export default class EnemyBehaviorRunner {
    private readonly state: EncounterState;

    private readonly decisionPolicy:
        EnemyDecisionPolicy;

    private readonly scienceIntelResolver:
        EnemyScienceIntelResolver;

    private readonly threatObserver:
        EnemyThreatObserver;

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
    }: EnemyBehaviorRunnerOptions) {
        this.state = state;

        this.decisionPolicy =
            new EnemyDecisionPolicy();

        this.scienceIntelResolver =
            new EnemyScienceIntelResolver(
                this.state,
                random,
            );

        this.threatObserver =
            new EnemyThreatObserver(
                this.state,
            );

        this.crewTaskRunner =
            new EnemyCrewTaskRunner({
                state: this.state,

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

    public step(deltaMs: number): void {
        this.threatObserver
            .synchronize();

        this.crewTaskRunner
            .advance(deltaMs);

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
