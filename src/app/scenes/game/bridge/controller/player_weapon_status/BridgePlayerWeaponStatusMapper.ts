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
    };
}

function mapWeaponStatus(
    weapon: ShipWeaponState,
): BridgePlayerWeaponStatusPayload {
    const remainingPhaseMs =
        getRemainingPhaseMs(
            weapon,
        );

    return {
        phase:
            weapon.phase,

        ...(remainingPhaseMs !== undefined
            ? {
                  remainingPhaseMs,
              }
            : {}),
    };
}

function getRemainingPhaseMs(
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
            return getRemainingMs(
                SHIP_WEAPON_TARGETING_DURATION_MS,
                weapon.phaseElapsedMs,
            );

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

            return getRemainingMs(
                definition.chargeDurationMs,
                weapon.phaseElapsedMs,
            );

        case SHIP_WEAPON_PHASE.COOLDOWN:
            return getRemainingMs(
                definition.cooldownDurationMs,
                weapon.phaseElapsedMs,
            );

        case SHIP_WEAPON_PHASE.CHANNELING:
        case SHIP_WEAPON_PHASE.DISPENSING:
            throw new Error(
                'Unsupported player weapon phase ' +
                    'for bridge status: ' +
                    weapon.id +
                    '/' +
                    weapon.phase,
            );
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
