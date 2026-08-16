// src/engine/encounter/combat/enemy/EnemyWorkExecutor.ts

import {
    DEFENSE_TURRETS,
} from '../../../content/catalogs/defense_turrets';
import {
    SHIP_WEAPONS,
} from '../../../content/catalogs/ship_weapons';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../content/catalogs/officer_tasks';
import {
    commitDefenseTurretCooldown,
    DEFENSE_TURRET_PHASE,
} from '../../../defs/defense_turret';
import {
    OFFICER_TASK_KIND,
} from '../../../defs/officer_task';
import {
    commitShipWeaponCooldown,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
} from '../../../defs/ship_weapon';
import {
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../../defs/shield_generator';
import type {
    ShipEncounterActorState,
} from '../../actors/ship/ship_encounter_actor';
import {
    getActiveCrewProgressEffects,
} from '../../crew_performance/get_active_crew_progress_effects';
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
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../model/missile_signature_intel';
import {
    SHIP_CREW_TASK_KIND,
} from '../../model/ship_crew_task';
import type {
    EncounterState,
} from '../../model/state';
import {
    spendPowerCoreCharge,
} from '../defense/spend_power_core_charge';
import EnemyCrewTaskRunner from './EnemyCrewTaskRunner';
import type {
    EnemyWorkIntent,
} from './EnemyDecisionPolicy';

type EnemyWorkExecutorOptions = {
    state: EncounterState;
    emit: (event: EncounterEvent) => void;
    crewTaskRunner: EnemyCrewTaskRunner;
};

// Physical command boundary for enemy behavior.
//
// Decision code chooses an EnemyWorkIntent.
// This executor re-validates that intent against authoritative state,
// commits resources, starts concrete crew/system work
// and emits the visible telegraph.
//
// It owns no priorities, captain timing or target selection.
export default class EnemyWorkExecutor {
    private readonly state:
        EncounterState;

    private readonly emit:
        (event: EncounterEvent) => void;

    private readonly crewTaskRunner:
        EnemyCrewTaskRunner;

    constructor({
        state,
        emit,
        crewTaskRunner,
    }: EnemyWorkExecutorOptions) {
        this.state = state;
        this.emit = emit;
        this.crewTaskRunner =
            crewTaskRunner;
    }

    public start(
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

        emitter.phase =
            SHIELD_GENERATOR_PHASE.COOLDOWN;
        emitter.phaseElapsedMs = 0;

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

        const definition =
            DEFENSE_TURRETS[
                defenseTurret.defenseTurretId
            ];

        commitDefenseTurretCooldown(
            defenseTurret,
            definition.cooldownDurationMs,
        );

        defenseTurret.phase =
            DEFENSE_TURRET_PHASE.LOADING;
        defenseTurret.phaseElapsedMs = 0;
        defenseTurret.targetProjectileId =
            intent.projectileId;

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

        switch (weapon.kind) {
            case SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER:
                weapon.phase =
                    SHIP_WEAPON_PHASE.TARGETING;
                break;

            case SHIP_WEAPON_KIND
                .BEAM_CANNON:
                this.commitWeaponCooldown(
                    weapon,
                );
                weapon.phase =
                    SHIP_WEAPON_PHASE.CHARGING;
                break;

            case SHIP_WEAPON_KIND
                .SPAM_PROJECTOR:
                this.commitWeaponCooldown(
                    weapon,
                );
                weapon.phase =
                    SHIP_WEAPON_PHASE.CHANNELING;
                weapon.activeChannelId = null;
                break;

            case SHIP_WEAPON_KIND
                .STICKY_MINE_DISPENSER:
                weapon.phase =
                    SHIP_WEAPON_PHASE.DISPENSING;
                weapon.dispensedMineCount = 0;
                break;

            default: {
                const exhaustiveWeapon:
                    never = weapon;

                throw new Error(
                    'Unhandled enemy weapon kind: ' +
                        String(exhaustiveWeapon),
                );
            }
        }

        weapon.phaseElapsedMs = 0;

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .ENEMY_ATTACK_STARTED,

            sourceActorId: actor.id,
            sourceWeaponId: weapon.id,
        });
    }

    private commitWeaponCooldown(
        weapon: ShipWeaponState,
    ): void {
        const definition =
            SHIP_WEAPONS[
                weapon.weaponId
            ];

        if (
            definition.kind !==
            weapon.kind
        ) {
            throw new Error(
                'Enemy weapon definition mismatch: ' +
                    weapon.id +
                    '/' +
                    weapon.weaponId,
            );
        }

        commitShipWeaponCooldown(
            weapon,
            definition.cooldownDurationMs,
        );
    }
}
