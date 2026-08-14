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
    STICKY_MINE_ID,
} from '../../src/engine/defs/sticky_mine';
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
    it('maps ready laser and loaded missile launcher', () => {
        expect(
            mapPlayerWeaponsToBridgeStatusPayload(
                presentWeapons(
                    createWeapons(),
                ),
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

            stickyMineDispenser: {
                phase:
                    SHIP_WEAPON_PHASE.READY,

                ammo: {
                    current: 6,
                    max: 6,
                },
            },
        });
    });

    it('maps sticky mine dispenser ammo and dispensing timing', () => {
        const weapons =
            createWeapons();

        const dispenser =
            weapons[2];

        if (
            !dispenser ||
            dispenser.kind !==
                SHIP_WEAPON_KIND
                    .STICKY_MINE_DISPENSER
        ) {
            throw new Error(
                'Expected sticky mine dispenser',
            );
        }

        dispenser.phase =
            SHIP_WEAPON_PHASE
                .DISPENSING;

        dispenser.phaseElapsedMs =
            500;

        dispenser.ammoCount = 5;
        dispenser.dispensedMineCount = 1;

        expect(
            mapPlayerWeaponsToBridgeStatusPayload(
                presentWeapons(
                    weapons,
                ),
            ).stickyMineDispenser,
        ).toEqual({
            phase:
                SHIP_WEAPON_PHASE
                    .DISPENSING,

            initialPhaseMs: 2000,
            remainingPhaseMs: 1500,

            ammo: {
                current: 5,
                max: 6,
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
                presentWeapons(
                    weapons,
                ),
            ),
        ).toEqual({
            laser: {
                phase:
                    SHIP_WEAPON_PHASE
                        .TARGETING,

                initialPhaseMs:
                    SHIP_WEAPON_TARGETING_DURATION_MS,

                remainingPhaseMs:
                    SHIP_WEAPON_TARGETING_DURATION_MS -
                    1250,
            },

            missileLauncher: {
                phase:
                    SHIP_WEAPON_PHASE
                        .TARGETING,

                initialPhaseMs:
                    SHIP_WEAPON_TARGETING_DURATION_MS,

                remainingPhaseMs:
                    SHIP_WEAPON_TARGETING_DURATION_MS -
                    1250,

                ammo: {
                    current: 5,
                    max: 5,
                },
            },

            stickyMineDispenser: {
                phase:
                    SHIP_WEAPON_PHASE
                        .TARGETING,

                initialPhaseMs:
                    SHIP_WEAPON_TARGETING_DURATION_MS,

                remainingPhaseMs:
                    SHIP_WEAPON_TARGETING_DURATION_MS -
                    1250,

                ammo: {
                    current: 6,
                    max: 6,
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
                presentWeapons(
                    weapons,
                ),
            ),
        ).toEqual({
            laser: {
                phase:
                    SHIP_WEAPON_PHASE
                        .CHARGING,

                initialPhaseMs:
                    12000,

                remainingPhaseMs:
                    9500,
            },

            missileLauncher: {
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

            stickyMineDispenser: {
                phase:
                    SHIP_WEAPON_PHASE.READY,

                ammo: {
                    current: 6,
                    max: 6,
                },
            },
        });
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


            ammoCount: 5,
        },

        {
            id:
                'sticky_mine_dispenser_player_00',

            kind:
                SHIP_WEAPON_KIND
                    .STICKY_MINE_DISPENSER,

            weaponId:
                SHIP_WEAPON_ID
                    .STICKY_MINE_DISPENSER_00,

            phase:
                SHIP_WEAPON_PHASE.READY,

            phaseElapsedMs: 0,

            loadedMineId:
                STICKY_MINE_ID
                    .BASIC_00,

            ammoCount: 6,
            dispensedMineCount: 0,
        },
    ];
}
