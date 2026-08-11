// src/engine/encounter/combat/EnemyTaskScheduler.ts

import {
    POINT_DEFENSES,
} from '../../../content/catalogs/point_defenses';
import {
    OFFICER_TASK_BASE_DURATION_MS,
} from '../../../content/rules/officer_tasks';
import {
    SHIP_SHIELD_DURATION_MS,
} from '../../../content/rules/shields';
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
    POINT_DEFENSE_PHASE,
} from '../../../defs/point_defense';
import {
    SHIP_WEAPON_PHASE,
} from '../../../defs/ship_weapon';
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
    type EnemyWorkIntent,
} from './EnemyDecisionPolicy';
import EnemyScienceIntelResolver from './intel/EnemyScienceIntelResolver';
import {
    getActivePlayerSpamChannels,
} from '../queries/get_active_player_spam_channels';

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

    random?: () => number;
};

// Directional laser shielding is temporarily retired.
 // Engineer remains available to dedicated defensive flows
 // such as sticky-mine clearing, but is not scheduled through
 // the old generic role-work loop until the new shield contract.
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
        random = Math.random,
    }: EnemyTaskSchedulerOptions) {
        this.state = state;
        this.emit = emit;

        this.decisionPolicy =
            new EnemyDecisionPolicy(
                random,
                this.state,
            );

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

                onShieldDeploymentCompleted:
                    (
                        actor,
                        shieldZone,
                    ) => {
                        actor.activeShield = {
                            zone:
                                shieldZone,

                            elapsedMs: 0,

                            durationMs:
                                SHIP_SHIELD_DURATION_MS,
                        };
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

            this.scheduleMineClearing(
                actor,
            );

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
                this.startPointDefenseInterception(
                    actor,
                    intent,
                );

                return;

            case SHIP_CREW_TASK_KIND
                .DEPLOY_SHIELD:
                this.startShieldDeployment(
                    actor,
                    intent,
                );

                return;
        }
    }

    private scheduleMineClearing(
        actor: ShipEncounterActorState,
    ): void {
        while (true) {
            const intent =
                this.decisionPolicy
                    .selectMineClearing(
                        actor,
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
                    OFFICER_TASK_BASE_DURATION_MS
                        .CLEAR_STICKY_MINE,
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
            getActivePlayerSpamChannels(
                this.state,
            ).find((candidate) => {
                return (
                    candidate.id ===
                        intent.channelId &&
                    candidate.targetActorId ===
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
                    OFFICER_TASK_BASE_DURATION_MS
                        .SCIENCE_PURGE_SPAM,
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

    private startPointDefenseInterception(
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
        const pointDefense =
            actor.pointDefense;

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
            !pointDefense ||
            pointDefense.id !==
                intent.pointDefenseId ||
            pointDefense.phase !==
                POINT_DEFENSE_PHASE.READY ||
            pointDefense.charges <= 0 ||
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
                'Cannot start enemy point-defense work: ' +
                    actor.id +
                    '/' +
                    intent.pointDefenseId +
                    '/' +
                    intent.projectileId,
            );
        }

        this.crewTaskRunner.start(
            actor,
            intent,
        );

        pointDefense.phase =
            POINT_DEFENSE_PHASE.LOADING;
        pointDefense.phaseElapsedMs = 0;
        pointDefense.loadedBand =
            intent.beamBand;
        pointDefense.targetProjectileId =
            intent.projectileId;

        const definition =
            POINT_DEFENSES[
                pointDefense.pointDefenseId
            ];

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .ENEMY_POINT_DEFENSE_LOADING_STARTED,

            sourceActorId: actor.id,
            pointDefenseId:
                pointDefense.id,

            projectileId:
                intent.projectileId,

            beamBand:
                intent.beamBand,

            loadDurationMs:
                definition.loadDurationMs,
        });
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

        if (
            !observation ||
            observation.kind !==
                ENEMY_THREAT_KIND.LASER ||
            observation.report?.kind !==
                ENEMY_THREAT_KIND.LASER ||
            observation.report
                .targetZone !==
                intent.shieldZone ||
            actor.shieldGenerator
                .charges <= 0
        ) {
            throw new Error(
                'Cannot start enemy shield work: ' +
                    actor.id +
                    '/' +
                    intent.observationId +
                    '/' +
                    intent.shieldZone,
            );
        }

        this.crewTaskRunner.start(
            actor,
            {
                ...intent,

                elapsedMs: 0,

                durationMs:
                    OFFICER_TASK_BASE_DURATION_MS
                        .ENGINEER_DEPLOY_SHIELD,
            },
        );

        // Same contract as the player:
        // deployment commitment spends the charge immediately.
        actor.shieldGenerator
            .charges -= 1;
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
