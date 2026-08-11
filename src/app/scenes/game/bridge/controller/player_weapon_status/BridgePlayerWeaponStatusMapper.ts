// src/app/scenes/game/bridge/controller/player_weapon_status/BridgePlayerWeaponStatusMapper.ts

import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../../../../engine/content/catalogs/ship_weapons';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
} from '../../../../../../engine/defs/ship_weapon';
import type {
    BridgePlayerWeaponStatusPayload,
    BridgePlayerWeaponsStatusUpdatedPayload,
} from '../../events/bridge_event';

export function mapPlayerWeaponsToBridgeStatusPayload(
    weapons: ShipWeaponState[],
): BridgePlayerWeaponsStatusUpdatedPayload {
    let laser:
        BridgePlayerWeaponStatusPayload
        | undefined;

    let missileLauncher:
        BridgePlayerWeaponsStatusUpdatedPayload[
            'missileLauncher'
        ];

    let stickyMineDispenser:
        BridgePlayerWeaponsStatusUpdatedPayload[
            'stickyMineDispenser'
        ];

    let spamProjector:
        BridgePlayerWeaponsStatusUpdatedPayload[
            'spamProjector'
        ];

    for (const weapon of weapons) {
        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.LASER: {
                if (laser) {
                    throw new Error(
                        'Bridge weapon status supports ' +
                            'one player laser',
                    );
                }

                laser =
                    mapWeaponStatus(
                        weapon,
                    );

                break;
            }

            case SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER: {
                if (missileLauncher) {
                    throw new Error(
                        'Bridge weapon status supports ' +
                            'one player missile launcher',
                    );
                }

                const definition =
                    SHIP_WEAPONS[
                        weapon.weaponId
                    ];

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

                missileLauncher = {
                    ...mapWeaponStatus(
                        weapon,
                    ),

                    ammo: {
                        current:
                            weapon.ammoCount,

                        max:
                            definition
                                .ammoCapacity,
                    },
                };

                break;
            }

            case SHIP_WEAPON_KIND
                .STICKY_MINE_DISPENSER: {
                if (stickyMineDispenser) {
                    throw new Error(
                        'Bridge weapon status supports ' +
                            'one player sticky mine dispenser',
                    );
                }

                const definition =
                    SHIP_WEAPONS[
                        weapon.weaponId
                    ];

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

                stickyMineDispenser = {
                    ...mapWeaponStatus(
                        weapon,
                    ),

                    ammo: {
                        current:
                            weapon.ammoCount,

                        max:
                            definition
                                .ammoCapacity,
                    },
                };

                break;
            }

            case SHIP_WEAPON_KIND
                .SPAM_PROJECTOR: {
                if (spamProjector) {
                    throw new Error(
                        'Bridge weapon status supports ' +
                            'one player spam projector',
                    );
                }

                spamProjector =
                    mapWeaponStatus(
                        weapon,
                    );

                break;
            }

            default:
                break;
        }
    }

    return {
        ...(laser
            ? {
                  laser,
              }
            : {}),

        ...(missileLauncher
            ? {
                  missileLauncher,
              }
            : {}),

        ...(stickyMineDispenser
            ? {
                  stickyMineDispenser,
              }
            : {}),

        ...(spamProjector
            ? {
                  spamProjector,
              }
            : {}),
    };
}

function mapWeaponStatus(
    weapon: ShipWeaponState,
): BridgePlayerWeaponStatusPayload {
    const phaseDurationMs =
        getPhaseDurationMs(
            weapon,
        );

    return {
        phase:
            weapon.phase,

        ...(phaseDurationMs !== undefined
            ? {
                  initialPhaseMs:
                      phaseDurationMs,

                  remainingPhaseMs:
                      getRemainingMs(
                          phaseDurationMs,
                          weapon.phaseElapsedMs,
                      ),
              }
            : {}),
    };
}

function getPhaseDurationMs(
    weapon: ShipWeaponState,
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

            return definition.chargeDurationMs;

        case SHIP_WEAPON_PHASE.COOLDOWN:
            return definition.cooldownDurationMs;

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

            return definition.channelDurationMs;

        case SHIP_WEAPON_PHASE.DISPENSING: {
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

            // The first mine is emitted when targeting completes.
            // DISPENSING then spans the remaining salvo intervals.
            // current ammo + already dispensed count recovers the
            // stable ammo-at-salvo-start value.
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
}

function getRemainingMs(
    durationMs: number,
    elapsedMs: number,
): number {
    return Math.max(
        0,
        durationMs -
            elapsedMs,
    );
}
