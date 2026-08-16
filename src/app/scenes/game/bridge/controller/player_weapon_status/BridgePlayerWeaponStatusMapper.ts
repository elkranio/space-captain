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

// Preserve installed-weapon identity all the way into bridge presentation.
// Multiple weapons of the same kind are normal; no kind-level collapsing lives
// on this boundary.
export function mapPlayerWeaponsToBridgeStatusPayload(
    snapshots:
        PlayerWeaponPresentationSnapshot[],
): BridgePlayerWeaponsStatusUpdatedPayload {
    return snapshots.map(
        mapWeaponStatus,
    );
}

function mapWeaponStatus(
    snapshot:
        PlayerWeaponPresentationSnapshot,
): BridgePlayerWeaponStatusPayload {
    const weapon =
        snapshot.state;

    const base = {
        id:
            weapon.id,

        weaponId:
            weapon.weaponId,

        kind:
            weapon.kind,

        phase:
            weapon.phase,

        ...mapPhaseTiming(
            snapshot,
        ),

        ...mapCooldownTiming(
            snapshot,
        ),
    };

    switch (weapon.kind) {
        case SHIP_WEAPON_KIND.BEAM_CANNON:
        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return base;

        case SHIP_WEAPON_KIND
            .MISSILE_LAUNCHER:
        case SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER:
            return {
                ...base,

                ammo: {
                    current:
                        weapon.ammoCount,

                    max:
                        requireAmmoCapacity(
                            snapshot,
                        ),
                },
            };

        default: {
            const exhaustiveWeapon:
                never =
                weapon;

            return exhaustiveWeapon;
        }
    }
}

function mapPhaseTiming(
    snapshot:
        PlayerWeaponPresentationSnapshot,
): Pick<
    BridgePlayerWeaponStatusPayload,
    'initialPhaseMs' | 'remainingPhaseMs'
> {
    const phaseDurationMs =
        snapshot.phaseDurationMs;

    if (phaseDurationMs === undefined) {
        return {};
    }

    return {
        initialPhaseMs:
            phaseDurationMs,

        remainingPhaseMs:
            Math.max(
                0,

                phaseDurationMs -
                    snapshot.state
                        .phaseElapsedMs,
            ),
    };
}

function mapCooldownTiming(
    snapshot:
        PlayerWeaponPresentationSnapshot,
): Pick<
    BridgePlayerWeaponStatusPayload,
    'initialCooldownMs' | 'remainingCooldownMs'
> {
    const remainingCooldownMs =
        snapshot.state
            .cooldownRemainingMs;

    if (remainingCooldownMs <= 0) {
        return {};
    }

    const initialCooldownMs =
        snapshot.cooldownDurationMs;

    if (
        initialCooldownMs <= 0 ||
        remainingCooldownMs >
            initialCooldownMs
    ) {
        throw new Error(
            'Player weapon presentation has invalid cooldown timing: ' +
                snapshot.state.id,
        );
    }

    return {
        initialCooldownMs,
        remainingCooldownMs,
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
