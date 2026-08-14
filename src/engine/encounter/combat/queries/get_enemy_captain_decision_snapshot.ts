// src/engine/encounter/combat/queries/get_enemy_captain_decision_snapshot.ts

import type {
    OfficerRole,
} from '../../../defs/officer';
import type {
    ShipDefenseTurretState,
} from '../../../defs/defense_turret';
import type {
    ShieldGeneratorState,
} from '../../../defs/shield_generator';
import {
    SHIP_WEAPON_KIND,
    type ShipWeaponState,
} from '../../../defs/ship_weapon';
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
    SHIP_CREW_TASK_KIND,
} from '../../model/ship_crew_task';
import type {
    EncounterState,
} from '../../model/state';
import {
    getEnemyThreatDecisionSnapshots,
    type EnemyThreatDecisionSnapshot,
} from './get_enemy_threat_decision_snapshots';

export type EnemyCaptainWeaponSnapshot = {
    id: string;

    kind:
        ShipWeaponState['kind'];

    phase:
        ShipWeaponState['phase'];

    ammoCount?: number;

    activeChannelId?:
        string | null;
};

export type EnemyCaptainDecisionSnapshot = {
    actorId: string;

    // Captain-owned tuning. Not objective threat truth.
    aggression: number;
    threatTimingWiggleMs: number;

    availableRoles:
        readonly OfficerRole[];

    claimedStickyMineIds:
        readonly string[];

    unresolvedMissileObservationIds:
        readonly string[];

    weapons:
        readonly EnemyCaptainWeaponSnapshot[];

    defenseTurret?: {
        id: string;

        phase:
            ShipDefenseTurretState[
                'phase'
            ];
    };

    powerCoreCharges: number;

    shieldGenerator?: {
        shieldGeneratorId:
            ShieldGeneratorState[
                'shieldGeneratorId'
            ];

        status:
            ShieldGeneratorState[
                'status'
            ];

        phase:
            ShieldGeneratorState[
                'phase'
            ];
    };

    hasActiveShield: boolean;

    threats:
        readonly EnemyThreatDecisionSnapshot[];

    incomingSpamChannelIds:
        readonly string[];
};

// Internal read model for one enemy captain decision.
//
// This is the only mutable-state -> policy boundary.
// The policy receives detached facts and cannot reach
// EncounterState or ShipEncounterActorState.
//
// Threats are resolved only from crew observations plus
// permitted physical timing. Hidden missile signature truth
// never enters this snapshot.
export function getEnemyCaptainDecisionSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
): EnemyCaptainDecisionSnapshot {
    const availableRoles =
        actor.crewRoles.filter(
            (role) => {
                return (
                    actor.crewTasks[
                        role
                    ] === undefined
                );
            },
        );

    const claimedStickyMineIds:
        string[] = [];

    for (
        const task of
        Object.values(
            actor.crewTasks,
        )
    ) {
        if (
            task?.kind ===
            SHIP_CREW_TASK_KIND
                .CLEAR_STICKY_MINE
        ) {
            claimedStickyMineIds
                .push(
                    task.mineId,
                );
        }
    }

    const unresolvedMissileObservationIds =
        actor
            .threatObservations
            .filter((observation) => {
                return (
                    observation.kind ===
                        ENEMY_THREAT_KIND
                            .MISSILE &&
                    observation.report ===
                        undefined
                );
            })
            .map((observation) => {
                return observation.id;
            });

    const incomingSpamChannelIds =
        getActiveCrewProgressEffects(
            state,
        )
            .filter((effect) => {
                return (
                    effect.source.kind ===
                        COMBAT_SOURCE_KIND
                            .PLAYER_SHIP &&
                    effect.target.kind ===
                        COMBAT_TARGET_KIND
                            .ACTOR &&
                    effect.target.actorId ===
                        actor.id
                );
            })
            .map((effect) => {
                return effect.id;
            });

    return {
        actorId:
            actor.id,

        aggression:
            actor.behavior
                .aggression,

        threatTimingWiggleMs:
            actor.behavior
                .threatTimingWiggleMs,

        availableRoles,

        claimedStickyMineIds,

        unresolvedMissileObservationIds,

        weapons:
            actor.weapons.map(
                createWeaponSnapshot,
            ),

        defenseTurret:
            actor.defenseTurret
                ? {
                      id:
                          actor
                              .defenseTurret
                              .id,

                      phase:
                          actor
                              .defenseTurret
                              .phase,
                  }
                : undefined,

        powerCoreCharges:
            actor.powerCore
                ?.charges ?? 0,

        shieldGenerator:
            actor.shieldGenerator
                ? {
                      shieldGeneratorId:
                          actor
                              .shieldGenerator
                              .shieldGeneratorId,

                      status:
                          actor
                              .shieldGenerator
                              .status,

                      phase:
                          actor
                              .shieldGenerator
                              .phase,
                  }
                : undefined,

        hasActiveShield:
            actor.activeShield !==
            undefined,

        threats:
            getEnemyThreatDecisionSnapshots(
                state,
                actor,
            ),

        incomingSpamChannelIds,
    };
}

function createWeaponSnapshot(
    weapon: ShipWeaponState,
): EnemyCaptainWeaponSnapshot {
    switch (weapon.kind) {
        case SHIP_WEAPON_KIND
            .MISSILE_LAUNCHER:
        case SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER:
            return {
                id:
                    weapon.id,

                kind:
                    weapon.kind,

                phase:
                    weapon.phase,

                ammoCount:
                    weapon.ammoCount,
            };

        case SHIP_WEAPON_KIND
            .SPAM_PROJECTOR:
            return {
                id:
                    weapon.id,

                kind:
                    weapon.kind,

                phase:
                    weapon.phase,

                activeChannelId:
                    weapon
                        .activeChannelId,
            };

        case SHIP_WEAPON_KIND
            .BEAM_CANNON:
            return {
                id:
                    weapon.id,

                kind:
                    weapon.kind,

                phase:
                    weapon.phase,
            };
    }
}
