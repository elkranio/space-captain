// tests/app/BridgePlayerWeaponStatusMapper.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../src/engine/content/catalogs/ship_weapons';
import {
    MISSILE_ID,
} from '../../src/engine/defs/missile';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
} from '../../src/engine/defs/ship_weapon';
import {
    mapPlayerWeaponsToBridgeStatusPayload,
} from '../../src/app/scenes/game/bridge/controller/player_weapon_status/BridgePlayerWeaponStatusMapper';

describe('Bridge player weapon status mapper', () => {
    it('maps ready laser and loaded missile launcher', () => {
        expect(
            mapPlayerWeaponsToBridgeStatusPayload(
                createWeapons(),
            ),
        ).toEqual({
            laser: {
                phase:
                    SHIP_WEAPON_PHASE.READY,
            },

            missileLauncher: {
                phase:
                    SHIP_WEAPON_PHASE.READY,

                ammo: {
                    current: 5,
                    max: 5,
                },
            },
        });
    });

    it('maps shared targeting countdown', () => {
        const weapons =
            createWeapons();

        for (const weapon of weapons) {
            weapon.phase =
                SHIP_WEAPON_PHASE
                    .TARGETING;

            weapon.phaseElapsedMs =
                1250;
        }

        expect(
            mapPlayerWeaponsToBridgeStatusPayload(
                weapons,
            ),
        ).toEqual({
            laser: {
                phase:
                    SHIP_WEAPON_PHASE
                        .TARGETING,

                remainingPhaseMs:
                    SHIP_WEAPON_TARGETING_DURATION_MS -
                    1250,
            },

            missileLauncher: {
                phase:
                    SHIP_WEAPON_PHASE
                        .TARGETING,

                remainingPhaseMs:
                    SHIP_WEAPON_TARGETING_DURATION_MS -
                    1250,

                ammo: {
                    current: 5,
                    max: 5,
                },
            },
        });
    });

    it('maps laser charge and launcher cooldown independently', () => {
        const weapons =
            createWeapons();

        const laser =
            weapons[0];

        const missileLauncher =
            weapons[1];

        laser.phase =
            SHIP_WEAPON_PHASE.CHARGING;

        laser.phaseElapsedMs =
            2500;

        missileLauncher.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        missileLauncher.phaseElapsedMs =
            4000;

        if (
            missileLauncher.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER
        ) {
            throw new Error(
                'Expected missile launcher',
            );
        }

        missileLauncher.ammoCount =
            3;

        expect(
            mapPlayerWeaponsToBridgeStatusPayload(
                weapons,
            ),
        ).toEqual({
            laser: {
                phase:
                    SHIP_WEAPON_PHASE
                        .CHARGING,

                remainingPhaseMs:
                    9500,
            },

            missileLauncher: {
                phase:
                    SHIP_WEAPON_PHASE
                        .COOLDOWN,

                remainingPhaseMs:
                    11000,

                ammo: {
                    current: 3,
                    max: 5,
                },
            },
        });
    });
});

function createWeapons():
    ShipWeaponState[] {
    return [
        {
            id:
                'laser_player_00',

            kind:
                SHIP_WEAPON_KIND.LASER,

            weaponId:
                SHIP_WEAPON_ID.LASER_00,

            phase:
                SHIP_WEAPON_PHASE.READY,

            phaseElapsedMs: 0,
        },

        {
            id:
                'missile_launcher_player_00',

            kind:
                SHIP_WEAPON_KIND
                    .MISSILE_LAUNCHER,

            weaponId:
                SHIP_WEAPON_ID
                    .MISSILE_LAUNCHER_00,

            phase:
                SHIP_WEAPON_PHASE.READY,

            phaseElapsedMs: 0,

            loadedMissileId:
                MISSILE_ID.RED_00,

            ammoCount: 5,
        },
    ];
}
