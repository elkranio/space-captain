// tests/app/BridgePlayerWeaponStatusMapper.test.ts
import { SHIP_WEAPONS } from '../../src/engine/content/catalogs/ship_weapons';

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
} from '../../src/engine/content/catalogs/ship_weapons';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
} from '../../src/engine/defs/ship_weapon';
import {
    createPlayerWeaponPresentationSnapshot,
} from '../../src/engine/encounter/snapshots/combat_presentation_snapshot';
import {
    mapPlayerWeaponsToBridgeStatusPayload,
} from '../../src/app/scenes/game/bridge/controller/player_weapon_status/BridgePlayerWeaponStatusMapper';

describe('Bridge player weapon status mapper', () => {
    it('preserves every installed weapon identity, including duplicate kinds', () => {
        const weapons = [
            createMissileLauncher(
                'missile_launcher_player_00',
                5,
            ),
            createMissileLauncher(
                'missile_launcher_player_01',
                3,
            ),
            createMissileLauncher(
                'missile_launcher_player_02',
                1,
            ),
            createMissileLauncher(
                'missile_launcher_player_03',
                0,
            ),
        ];

        expect(
            mapPlayerWeaponsToBridgeStatusPayload(
                presentWeapons(
                    weapons,
                ),
            ),
        ).toEqual([
            {
                id:
                    'missile_launcher_player_00',
                weaponId:
                    SHIP_WEAPON_ID
                        .MISSILE_LAUNCHER_00,
                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,
                phase:
                    SHIP_WEAPON_PHASE.READY,
                ammo: {
                    current: 5,
                    max: 5,
                },
            },
            {
                id:
                    'missile_launcher_player_01',
                weaponId:
                    SHIP_WEAPON_ID
                        .MISSILE_LAUNCHER_00,
                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,
                phase:
                    SHIP_WEAPON_PHASE.READY,
                ammo: {
                    current: 3,
                    max: 5,
                },
            },
            {
                id:
                    'missile_launcher_player_02',
                weaponId:
                    SHIP_WEAPON_ID
                        .MISSILE_LAUNCHER_00,
                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,
                phase:
                    SHIP_WEAPON_PHASE.READY,
                ammo: {
                    current: 1,
                    max: 5,
                },
            },
            {
                id:
                    'missile_launcher_player_03',
                weaponId:
                    SHIP_WEAPON_ID
                        .MISSILE_LAUNCHER_00,
                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,
                phase:
                    SHIP_WEAPON_PHASE.READY,
                ammo: {
                    current: 0,
                    max: 5,
                },
            },
        ]);
    });

    it('maps phase timing and ammo per concrete installed weapon', () => {
        const beamCannon:
            ShipWeaponState = {
                id:
                    'beam_cannon_player_00',
                kind:
                    SHIP_WEAPON_KIND
                        .BEAM_CANNON,
                weaponId:
                    SHIP_WEAPON_ID
                        .BEAM_CANNON_00,
                phase:
                    SHIP_WEAPON_PHASE
                        .CHARGING,
                phaseElapsedMs:
                    1250,

                cooldownRemainingMs:
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .BEAM_CANNON_00
                    ].cooldownDurationMs -
                    1250,
            };

        const launcher =
            createMissileLauncher(
                'missile_launcher_player_00',
                3,
            );

        launcher.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;
        launcher.phaseElapsedMs =
            4000;
        launcher.cooldownRemainingMs =
            SHIP_WEAPONS[
                SHIP_WEAPON_ID
                    .MISSILE_LAUNCHER_00
            ].cooldownDurationMs -
            4000;

        expect(
            mapPlayerWeaponsToBridgeStatusPayload(
                presentWeapons([
                    beamCannon,
                    launcher,
                ]),
            ),
        ).toEqual([
            {
                id:
                    'beam_cannon_player_00',
                weaponId:
                    SHIP_WEAPON_ID
                        .BEAM_CANNON_00,
                kind:
                    SHIP_WEAPON_KIND
                        .BEAM_CANNON,
                phase:
                    SHIP_WEAPON_PHASE
                        .CHARGING,
                initialPhaseMs:
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .BEAM_CANNON_00
                    ].chargeDurationMs,
                remainingPhaseMs:
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .BEAM_CANNON_00
                    ].chargeDurationMs -
                    1250,
            },
            {
                id:
                    'missile_launcher_player_00',
                weaponId:
                    SHIP_WEAPON_ID
                        .MISSILE_LAUNCHER_00,
                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,
                phase:
                    SHIP_WEAPON_PHASE
                        .COOLDOWN,
                initialPhaseMs:
                    15000,
                remainingPhaseMs:
                    11000,
                ammo: {
                    current: 3,
                    max: 5,
                },
            },
        ]);
    });
});

function presentWeapons(
    weapons:
        ShipWeaponState[],
) {
    return weapons.map(
        createPlayerWeaponPresentationSnapshot,
    );
}

function createMissileLauncher(
    id:
        string,
    ammoCount:
        number,
): Extract<
    ShipWeaponState,
    {
        kind:
            typeof SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER;
    }
> {
    return {
        id,

        kind:
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER,

        weaponId:
            SHIP_WEAPON_ID
                .MISSILE_LAUNCHER_00,

        phase:
            SHIP_WEAPON_PHASE.READY,

        phaseElapsedMs: 0,
        cooldownRemainingMs: 0,

        ammoCount,
    };
}
