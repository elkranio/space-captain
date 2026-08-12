// src/app/scenes/game/bridge/controller/player_weapon_status/BridgePlayerWeaponStatusMapper.ts

import {
    SHIP_WEAPON_KIND,
} from '../../../../../../engine/defs/ship_weapon';
import type {
    PlayerWeaponPresentationSnapshot,
} from '../../../../../../engine/encounter/snapshots/combat_presentation_snapshot';
import type {
    BridgePlayerWeaponStatusPayload,
    BridgePlayerWeaponsStatusUpdatedPayload,
} from '../../events/bridge_event';

export function mapPlayerWeaponsToBridgeStatusPayload(
    snapshots:
        PlayerWeaponPresentationSnapshot[],
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

    for (const snapshot of snapshots) {
        const weapon =
            snapshot.state;

        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.LASER:
                if (laser) {
                    throw new Error(
                        'Bridge weapon status supports ' +
                            'one player laser',
                    );
                }

                laser =
                    mapWeaponStatus(
                        snapshot,
                    );

                break;

            case SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER:
                if (missileLauncher) {
                    throw new Error(
                        'Bridge weapon status supports ' +
                            'one player missile launcher',
                    );
                }

                missileLauncher = {
                    ...mapWeaponStatus(
                        snapshot,
                    ),

                    ammo: {
                        current:
                            weapon.ammoCount,

                        max:
                            requireAmmoCapacity(
                                snapshot,
                            ),
                    },
                };

                break;

            case SHIP_WEAPON_KIND
                .STICKY_MINE_DISPENSER:
                if (stickyMineDispenser) {
                    throw new Error(
                        'Bridge weapon status supports ' +
                            'one player sticky mine dispenser',
                    );
                }

                stickyMineDispenser = {
                    ...mapWeaponStatus(
                        snapshot,
                    ),

                    ammo: {
                        current:
                            weapon.ammoCount,

                        max:
                            requireAmmoCapacity(
                                snapshot,
                            ),
                    },
                };

                break;

            case SHIP_WEAPON_KIND
                .SPAM_PROJECTOR:
                if (spamProjector) {
                    throw new Error(
                        'Bridge weapon status supports ' +
                            'one player spam projector',
                    );
                }

                spamProjector =
                    mapWeaponStatus(
                        snapshot,
                    );

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
    snapshot:
        PlayerWeaponPresentationSnapshot,
): BridgePlayerWeaponStatusPayload {
    const weapon =
        snapshot.state;

    const phaseDurationMs =
        snapshot.phaseDurationMs;

    return {
        phase:
            weapon.phase,

        ...(phaseDurationMs !==
        undefined
            ? {
                  initialPhaseMs:
                      phaseDurationMs,

                  remainingPhaseMs:
                      Math.max(
                          0,

                          phaseDurationMs -
                              weapon
                                  .phaseElapsedMs,
                      ),
              }
            : {}),
    };
}

function requireAmmoCapacity(
    snapshot:
        PlayerWeaponPresentationSnapshot,
): number {
    const capacity =
        snapshot.ammoCapacity;

    if (capacity !== undefined) {
        return capacity;
    }

    throw new Error(
        'Player weapon presentation is missing ammo capacity: ' +
            snapshot.state.id,
    );
}
