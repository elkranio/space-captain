// src/engine/encounter/combat/EnemyTaskScheduler.ts

import {
    DEFENSE_TURRETS,
} from '../../../content/catalogs/defense_turrets';
import {
    spendPowerCoreCharge,
} from '../defense/spend_power_core_charge';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../content/catalogs/officer_tasks';
import {
    OFFICER_TASK_KIND,
} from '../../../defs/officer_task';
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
import {
    DEFENSE_TURRET_PHASE,
} from '../../../defs/defense_turret';
import {
    SHIP_WEAPON_PHASE,
} from '../../../defs/ship_weapon';
import {
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../../defs/shield_generator';
import type {
    ShipEncounterActorState,
} from '../../actors/ship/ship_encounter_actor';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../model/combat';
import {
    ENEMY_THREAT_KIND,
} from '../../model/enemy_threat_observation';
import {
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../model/missile_signature_intel';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../../model/event';
import {
    SHIP_CREW_TASK_KIND,
} from '../../model/ship_crew_task';
import type {
    EncounterState,
} from '../../model/state';
import EnemyCrewTaskRunner from './EnemyCrewTaskRunner';
import EnemyDecisionPolicy, {
    type EnemyDecisionContext,
    type EnemyWorkIntent,
} from './EnemyDecisionPolicy';
import {
    getEnemyThreatDecisionSnapshots,
} from '../queries/get_enemy_threat_decision_snapshots';
import EnemyScienceIntelResolver from './intel/EnemyScienceIntelResolver';
import {
    getActiveCrewProgressEffects,
} from '../../crew_performance/get_active_crew_progress_effects';

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

    private readonly decisionPolicy:
        EnemyDecisionPolicy;

    private readonly scienceIntelResolver:
        EnemyScienceIntelResolver;

    private readonly crewTaskRunner:
        EnemyCrewTaskRunner;

    constructor({
        state,
        emit,
        clearPlayerStickyMine,
        purgePlayerSpamChannel,
        deployEnemyShield,
        random = Math.random,
    }: EnemyTaskSchedulerOptions) {
        this.state = state;
        this.emit = emit;

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
                .DEPLOY_SHIELD:
                this.startShieldDeployment(
                    actor,
                    intent,
                );

                return;

            case SHIP_CREW_TASK_KIND
                .PURGE_SPAM:
                this.startSpamPurging(
                    actor,
                    intent,
                );

                return;

            case SHIP_CREW_TASK_KIND
                .CLEAR_STICKY_MINE:
                this.startStickyMineClearing(
                    actor,
                    intent,
                );

                return;

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

            case SHIP_CREW_TASK_KIND
                .INTERCEPT_MISSILE:
                this.startDefenseTurretInterception(
                    actor,
                    intent,
                );

                return;

        }
    }

    private startShieldDeployment(
        actor: ShipEncounterActorState,
        intent:
            Extract<
                EnemyWorkIntent,
                {
                    kind:
                        typeof SHIP_CREW_TASK_KIND
                            .DEPLOY_SHIELD;
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

        const emitter =
            actor.shieldGenerator;

        const powerCore =
            actor.powerCore;

        if (
            !observation ||
            observation.kind !==
                ENEMY_THREAT_KIND.BEAM_CANNON ||
            !emitter ||
            emitter.status !==
                SHIELD_GENERATOR_STATUS
                    .ONLINE ||
            emitter.phase !==
                SHIELD_GENERATOR_PHASE
                    .READY ||
            actor.activeShield ||
            !powerCore ||
            powerCore.charges <= 0
        ) {
            throw new Error(
                'Cannot start enemy shield deployment: ' +
                    actor.id +
                    '/' +
                    intent.observationId,
            );
        }

        // Same economic rule as player defensive work:
        // charge is committed when Engineer starts.
        spendPowerCoreCharge(
            powerCore,
        );

        this.crewTaskRunner.start(
            actor,
            {
                ...intent,

                elapsedMs: 0,

                durationMs:
                    getTimedOfficerTaskDurationMs(
                        OFFICER_TASK_KIND
                            .ENGINEER_DEPLOY_SHIELD,
                    ),
            },
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

            this.startWork(
                actor,
                intent,
            );
        }
    }

    private startStickyMineClearing(
        actor: ShipEncounterActorState,
        intent:
            Extract<
                EnemyWorkIntent,
                {
                    kind:
                        typeof SHIP_CREW_TASK_KIND
                            .CLEAR_STICKY_MINE;
                }
            >,
    ): void {
        const mine =
            this.state.combat
                .stickyMines
                .find((candidate) => {
                    return (
                        candidate.id ===
                            intent.mineId &&
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
            throw new Error(
                'Cannot start enemy sticky-mine ' +
                    'clearing: ' +
                    actor.id +
                    '/' +
                    intent.role +
                    '/' +
                    intent.mineId,
            );
        }

        this.crewTaskRunner.start(
            actor,
            {
                ...intent,

                elapsedMs: 0,

                durationMs:
                    getTimedOfficerTaskDurationMs(
                        OFFICER_TASK_KIND
                            .CLEAR_STICKY_MINE,
                    ),
            },
        );
    }

    private startSpamPurging(
        actor: ShipEncounterActorState,
        intent:
            Extract<
                EnemyWorkIntent,
                {
                    kind:
                        typeof SHIP_CREW_TASK_KIND
                            .PURGE_SPAM;
                }
            >,
    ): void {
        const channel =
            getActiveCrewProgressEffects(
                this.state,
            ).find((effect) => {
                return (
                    effect.id ===
                        intent.channelId &&
                    effect.source.kind ===
                        COMBAT_SOURCE_KIND
                            .PLAYER_SHIP &&
                    effect.target.kind ===
                        COMBAT_TARGET_KIND
                            .ACTOR &&
                    effect.target.actorId ===
                        actor.id
                );
            });

        if (!channel) {
            throw new Error(
                'Cannot start enemy spam purge: ' +
                    actor.id +
                    '/' +
                    intent.channelId,
            );
        }

        this.crewTaskRunner.start(
            actor,
            {
                ...intent,

                elapsedMs: 0,

                durationMs:
                    getTimedOfficerTaskDurationMs(
                        OFFICER_TASK_KIND
                            .SCIENCE_PURGE_SPAM,
                    ),
            },
        );
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
            observation.report?.status ===
                MISSILE_SIGNATURE_INTEL_STATUS
                    .CONFIRMED
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
                    getTimedOfficerTaskDurationMs(
                        OFFICER_TASK_KIND
                            .SCIENCE_IDENTIFY_THREAT,
                    ),
            },
        );
    }

    private startDefenseTurretInterception(
        actor: ShipEncounterActorState,
        intent:
            Extract<
                EnemyWorkIntent,
                {
                    kind:
                        typeof SHIP_CREW_TASK_KIND
                            .INTERCEPT_MISSILE;
                }
            >,
    ): void {
        const defenseTurret =
            actor.defenseTurret;

        const powerCore =
            actor.powerCore;

        const projectile =
            this.state
                .combat
                .projectiles
                .find((candidate) => {
                    return (
                        candidate.id ===
                        intent.projectileId
                    );
                });

        if (
            !defenseTurret ||
            defenseTurret.id !==
                intent.defenseTurretId ||
            defenseTurret.phase !==
                DEFENSE_TURRET_PHASE.READY ||
            !powerCore ||
            powerCore.charges <= 0 ||
            !projectile ||
            projectile.source.kind !==
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP ||
            projectile.target.kind !==
                COMBAT_TARGET_KIND.ACTOR ||
            projectile.target.actorId !==
                actor.id
        ) {
            throw new Error(
                'Cannot start enemy defense-turret work: ' +
                    actor.id +
                    '/' +
                    intent.defenseTurretId +
                    '/' +
                    intent.projectileId,
            );
        }

        // Commit defensive energy when work starts.
        // This mirrors the player rule and prevents
        // a later Shield Generator / Defense Turret consumer from double-claiming
        // the same shared charge.
        spendPowerCoreCharge(
            powerCore,
        );

        this.crewTaskRunner.start(
            actor,
            intent,
        );

        defenseTurret.phase =
            DEFENSE_TURRET_PHASE.LOADING;
        defenseTurret.phaseElapsedMs = 0;
        defenseTurret.targetProjectileId =
            intent.projectileId;

        const definition =
            DEFENSE_TURRETS[
                defenseTurret.defenseTurretId
            ];

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .ENEMY_DEFENSE_TURRET_LOADING_STARTED,

            sourceActorId: actor.id,
            defenseTurretId:
                defenseTurret.id,

            projectileId:
                intent.projectileId,

            loadDurationMs:
                definition.loadDurationMs,
        });
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
