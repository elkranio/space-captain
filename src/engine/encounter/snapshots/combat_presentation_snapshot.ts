// src/engine/encounter/snapshots/combat_presentation_snapshot.ts

import {
    DEFENSE_CAPACITORS,
} from '../../content/catalogs/defense_capacitors';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../content/catalogs/ship_weapons';
import type {
    DefenseCapacitorState,
} from '../../defs/defense_capacitor';
import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../defs/officer';
import type {
    PlayerHullState,
} from '../../defs/player';
import type {
    ShipDriveState,
} from '../../defs/ship_drive';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type {
    ShieldEmitterState,
} from '../../defs/shield_emitter';
import {
    getAvailableOfficerCommands,
} from '../commands/queries/get_available_officer_commands';
import {
    getEnemyShipTelemetrySnapshots,
    type EnemyShipTelemetrySnapshot,
} from '../combat/queries/get_enemy_ship_telemetry_snapshots';
import {
    getLaserThreatSnapshots,
    type LaserThreatSnapshot,
} from '../combat/queries/get_laser_threat_snapshots';
import {
    getStickyMineSnapshots,
    type StickyMineSnapshot,
} from '../combat/queries/get_sticky_mine_snapshots';
import type {
    AvailableOfficerCommand,
} from '../model/command';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    type ActiveShieldState,
    type CombatProjectileState,
    type SpamChannelState,
    type StickyMineState,
} from '../model/combat';
import type {
    OfficerAvailabilityStates,
} from '../model/officer_availability';
import type {
    OfficerTaskState,
} from '../model/officer_task';
import type {
    EncounterState,
} from '../model/state';
import {
    getOfficerAvailabilityStates,
} from '../officer_availability/queries/get_officer_availability_states';

export type DefenseCapacitorPresentationSnapshot = {
    state:
        DefenseCapacitorState;

    capacity: number;

    rechargeProgress?:
        number;
};

export type PlayerWeaponPresentationSnapshot = {
    state:
        ShipWeaponState;

    phaseDurationMs?:
        number;

    ammoCapacity?:
        number;
};

export type EnemyShipPresentationSnapshot =
    Omit<
        EnemyShipTelemetrySnapshot,
        'defenseCapacitor'
    > & {
        defenseCapacitor?:
            DefenseCapacitorPresentationSnapshot;
    };

export type CombatPresentationSnapshot = {
    player: {
        hull:
            PlayerHullState;

        drive:
            ShipDriveState;

        defenseCapacitor?:
            DefenseCapacitorPresentationSnapshot;

        shieldEmitter?:
            ShieldEmitterState;

        activeShield:
            ActiveShieldState | null;

        weapons:
            PlayerWeaponPresentationSnapshot[];

        officerAvailability:
            OfficerAvailabilityStates;

        officerTasks:
            OfficerTaskState[];
    };

    enemyShips:
        EnemyShipPresentationSnapshot[];

    incomingMissiles:
        CombatProjectileState[];

    outgoingMissiles:
        CombatProjectileState[];

    outgoingStickyMines:
        StickyMineState[];

    stickyMineSnapshots:
        StickyMineSnapshot[];

    laserThreats:
        LaserThreatSnapshot[];

    spamChannels:
        SpamChannelState[];

    commandsByRole:
        Record<
            OfficerRole,
            AvailableOfficerCommand[]
        >;
};

// Единый read-model одного combat frame.
//
// Mutable truth остаётся только в EncounterState.
// Snapshot ничего не кэширует и не становится вторым state:
// он один раз собирает все presentation/query данные
// из одного состояния, после чего EncounterSnapshotReader
// рекурсивно отсоединяет результат от engine.
export function createCombatPresentationSnapshot(
    state:
        EncounterState,
): CombatPresentationSnapshot {
    return {
        player: {
            hull:
                state.playerHull,

            drive:
                state.drive,

            ...(state.combat
                .defenseCapacitor
                ? {
                      defenseCapacitor:
                          createDefenseCapacitorPresentationSnapshot(
                              state.combat
                                  .defenseCapacitor,
                          ),
                  }
                : {}),

            ...(state.combat
                .shieldEmitter
                ? {
                      shieldEmitter:
                          state.combat
                              .shieldEmitter,
                  }
                : {}),

            activeShield:
                state.combat
                    .activeShield,

            weapons:
                state.combat
                    .playerWeapons
                    .map(
                        createPlayerWeaponPresentationSnapshot,
                    ),

            officerAvailability:
                getOfficerAvailabilityStates(
                    state,
                ),

            officerTasks:
                Object.values(
                    state.officerTasks,
                ).filter(
                    (
                        task,
                    ): task is OfficerTaskState => {
                        return task !== undefined;
                    },
                ),
        },

        enemyShips:
            getEnemyShipTelemetrySnapshots(
                state,
            ).map(
                createEnemyShipPresentationSnapshot,
            ),

        incomingMissiles:
            state.combat
                .projectiles
                .filter((projectile) => {
                    return (
                        projectile
                            .source.kind ===
                            COMBAT_SOURCE_KIND
                                .ACTOR &&
                        projectile
                            .target.kind ===
                            COMBAT_TARGET_KIND
                                .PLAYER_SHIP
                    );
                }),

        outgoingMissiles:
            state.combat
                .projectiles
                .filter((projectile) => {
                    return (
                        projectile
                            .source.kind ===
                            COMBAT_SOURCE_KIND
                                .PLAYER_SHIP &&
                        projectile
                            .target.kind ===
                            COMBAT_TARGET_KIND
                                .ACTOR
                    );
                }),

        outgoingStickyMines:
            state.combat
                .stickyMines
                .filter((mine) => {
                    return (
                        mine.source.kind ===
                            COMBAT_SOURCE_KIND
                                .PLAYER_SHIP &&
                        mine.target.kind ===
                            COMBAT_TARGET_KIND
                                .ACTOR
                    );
                }),

        stickyMineSnapshots:
            getStickyMineSnapshots(
                state,
            ),

        laserThreats:
            getLaserThreatSnapshots(
                state,
            ),

        spamChannels:
            selectSpamChannels(
                state,
            ),

        commandsByRole: {
            [OFFICER_ROLE.SCIENCE]:
                getAvailableOfficerCommands(
                    state,
                    OFFICER_ROLE.SCIENCE,
                ),

            [OFFICER_ROLE.HELM]:
                getAvailableOfficerCommands(
                    state,
                    OFFICER_ROLE.HELM,
                ),

            [OFFICER_ROLE.WEAPONS]:
                getAvailableOfficerCommands(
                    state,
                    OFFICER_ROLE.WEAPONS,
                ),

            [OFFICER_ROLE.ENGINEER]:
                getAvailableOfficerCommands(
                    state,
                    OFFICER_ROLE.ENGINEER,
                ),
        },
    };
}

export function createDefenseCapacitorPresentationSnapshot(
    state:
        DefenseCapacitorState,
): DefenseCapacitorPresentationSnapshot {
    const definition =
        DEFENSE_CAPACITORS[
            state.defenseCapacitorId
        ];

    const rechargeProgress =
        state.charges <
        definition.capacity
            ? clamp01(
                  state.rechargeElapsedMs /
                      definition
                          .rechargeDurationMs,
              )
            : undefined;

    return {
        state,
        capacity:
            definition.capacity,

        ...(rechargeProgress !==
        undefined
            ? {
                  rechargeProgress,
              }
            : {}),
    };
}

export function createPlayerWeaponPresentationSnapshot(
    weapon:
        ShipWeaponState,
): PlayerWeaponPresentationSnapshot {
    const phaseDurationMs =
        getWeaponPhaseDurationMs(
            weapon,
        );

    const ammoCapacity =
        getWeaponAmmoCapacity(
            weapon,
        );

    return {
        state:
            weapon,

        ...(phaseDurationMs !==
        undefined
            ? {
                  phaseDurationMs,
              }
            : {}),

        ...(ammoCapacity !==
        undefined
            ? {
                  ammoCapacity,
              }
            : {}),
    };
}

function createEnemyShipPresentationSnapshot(
    enemy:
        EnemyShipTelemetrySnapshot,
): EnemyShipPresentationSnapshot {
    const {
        defenseCapacitor,
        ...rest
    } = enemy;

    return {
        ...rest,

        ...(defenseCapacitor
            ? {
                  defenseCapacitor:
                      createDefenseCapacitorPresentationSnapshot(
                          defenseCapacitor,
                      ),
              }
            : {}),
    };
}

function getWeaponAmmoCapacity(
    weapon:
        ShipWeaponState,
): number | undefined {
    const definition =
        SHIP_WEAPONS[
            weapon.weaponId
        ];

    switch (weapon.kind) {
        case SHIP_WEAPON_KIND
            .MISSILE_LAUNCHER:
            if (
                definition.kind !==
                SHIP_WEAPON_KIND
                    .MISSILE_LAUNCHER
            ) {
                throw new Error(
                    'Player missile launcher ' +
                        'definition mismatch: ' +
                        weapon.id,
                );
            }

            return definition
                .ammoCapacity;

        case SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER:
            if (
                definition.kind !==
                SHIP_WEAPON_KIND
                    .STICKY_MINE_DISPENSER
            ) {
                throw new Error(
                    'Player sticky mine dispenser ' +
                        'definition mismatch: ' +
                        weapon.id,
                );
            }

            return definition
                .ammoCapacity;

        case SHIP_WEAPON_KIND.LASER:
        case SHIP_WEAPON_KIND
            .SPAM_PROJECTOR:
            return undefined;
    }
}

function getWeaponPhaseDurationMs(
    weapon:
        ShipWeaponState,
): number | undefined {
    const definition =
        SHIP_WEAPONS[
            weapon.weaponId
        ];

    switch (weapon.phase) {
        case SHIP_WEAPON_PHASE.READY:
            return undefined;

        case SHIP_WEAPON_PHASE.TARGETING:
            return SHIP_WEAPON_TARGETING_DURATION_MS;

        case SHIP_WEAPON_PHASE.CHARGING:
            if (
                definition.kind !==
                SHIP_WEAPON_KIND.LASER
            ) {
                throw new Error(
                    'Only player laser can be ' +
                        'in charging phase: ' +
                        weapon.id,
                );
            }

            return definition
                .chargeDurationMs;

        case SHIP_WEAPON_PHASE.COOLDOWN:
            return definition
                .cooldownDurationMs;

        case SHIP_WEAPON_PHASE.CHANNELING:
            if (
                definition.kind !==
                SHIP_WEAPON_KIND
                    .SPAM_PROJECTOR
            ) {
                throw new Error(
                    'Only player spam projector can be ' +
                        'in channeling phase: ' +
                        weapon.id,
                );
            }

            return definition
                .channelDurationMs;

        case SHIP_WEAPON_PHASE.DISPENSING:
            if (
                definition.kind !==
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER ||
                weapon.kind !==
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER
            ) {
                throw new Error(
                    'Only player sticky mine dispenser can be ' +
                        'in dispensing phase: ' +
                        weapon.id,
                );
            }

            // Первая мина выходит при завершении TARGETING.
            // DISPENSING покрывает только интервалы
            // между оставшимися минами salvo.
            const plannedMineCount =
                Math.min(
                    definition.salvoSize,

                    weapon.ammoCount +
                        weapon
                            .dispensedMineCount,
                );

            return Math.max(
                0,

                (plannedMineCount - 1) *
                    definition
                        .launchIntervalMs,
            );
    }
}

function selectSpamChannels(
    state:
        EncounterState,
): SpamChannelState[] {
    const channels:
        SpamChannelState[] = [];

    for (const actor of state.actors) {
        if (actor.hull <= 0) {
            continue;
        }

        for (const weapon of actor.weapons) {
            if (
                weapon.kind !==
                    SHIP_WEAPON_KIND
                        .SPAM_PROJECTOR ||
                weapon.phase !==
                    SHIP_WEAPON_PHASE
                        .CHANNELING
            ) {
                continue;
            }

            const channelId =
                weapon.activeChannelId;

            if (!channelId) {
                throw new Error(
                    'Spam projector channel id is missing: ' +
                        `${actor.id}/${weapon.id}/${weapon.phase}`,
                );
            }

            const definition =
                SHIP_WEAPONS[
                    weapon.weaponId
                ];

            if (
                definition.kind !==
                SHIP_WEAPON_KIND
                    .SPAM_PROJECTOR
            ) {
                throw new Error(
                    'Spam projector definition mismatch: ' +
                        `${actor.id}/${weapon.id}/${weapon.weaponId}`,
                );
            }

            channels.push({
                id:
                    channelId,

                sourceActorId:
                    actor.id,

                sourceWeaponId:
                    weapon.id,

                elapsedMs:
                    Math.min(
                        weapon
                            .phaseElapsedMs,

                        definition
                            .channelDurationMs,
                    ),

                durationMs:
                    definition
                        .channelDurationMs,
            });
        }
    }

    return channels;
}

function clamp01(
    value: number,
): number {
    return Math.max(
        0,
        Math.min(
            1,
            value,
        ),
    );
}
