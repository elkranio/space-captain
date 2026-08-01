// tests/engine/content/create_new_run_state.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    createNewRunState,
} from '../../../src/engine/content/new_game/create_new_run_state';
import {
    MISSILE_ID,
} from '../../../src/engine/defs/missile';
import {
    SHIP_DRIVE_ID,
    SHIP_DRIVE_STATUS,
} from '../../../src/engine/defs/ship_drive';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';

describe('createNewRunState', () => {
    it('creates the configured starting player ship', () => {
        const run = createNewRunState();

        expect(run.player.ship).toEqual({
            hull: 3,
            maxHull: 3,

            drive: {
                id: 'drive_player_00',

                driveId:
                    SHIP_DRIVE_ID.BASIC_00,

                status:
                    SHIP_DRIVE_STATUS.ONLINE,
            },

            pointDefense: {
                charges: 4,
                maxCharges: 4,
            },

            shieldGenerator: {
                charges: 3,
                maxCharges: 3,

                chargeRegenerationDurationMs:
                    20000,

                chargeRegenerationElapsedMs: 0,
            },

            weapons: [
                {
                    id: 'laser_player_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .LASER_00,

                    kind:
                        SHIP_WEAPON_KIND.LASER,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,
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

                    loadedMissileId:
                        MISSILE_ID.RED_00,

                    ammoCount: 5,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,
                },
            ],
        });
    });

    it('creates independent mutable player ship state for each run', () => {
        const firstRun = createNewRunState();
        const secondRun = createNewRunState();

        firstRun.player.ship.hull = 1;

        firstRun.player.ship.drive.status =
            SHIP_DRIVE_STATUS.DISABLED;

        firstRun
            .player
            .ship
            .pointDefense
            .charges = 0;

        firstRun
            .player
            .ship
            .shieldGenerator
            .charges = 0;

        firstRun
            .player
            .ship
            .shieldGenerator
            .chargeRegenerationElapsedMs =
                10000;

        const firstWeapon =
            firstRun.player.ship.weapons[0];

        const secondWeapon =
            secondRun.player.ship.weapons[0];

        if (!firstWeapon || !secondWeapon) {
            throw new Error(
                'Expected installed player lasers',
            );
        }

        firstWeapon.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        firstWeapon.phaseElapsedMs = 500;

        expect(
            firstRun.player.ship.weapons,
        ).not.toBe(
            secondRun.player.ship.weapons,
        );

        expect(firstWeapon).not.toBe(
            secondWeapon,
        );

        expect(secondRun.player.ship).toEqual({
            hull: 3,
            maxHull: 3,

            drive: {
                id: 'drive_player_00',

                driveId:
                    SHIP_DRIVE_ID.BASIC_00,

                status:
                    SHIP_DRIVE_STATUS.ONLINE,
            },

            pointDefense: {
                charges: 4,
                maxCharges: 4,
            },

            shieldGenerator: {
                charges: 3,
                maxCharges: 3,

                chargeRegenerationDurationMs:
                    20000,

                chargeRegenerationElapsedMs: 0,
            },

            weapons: [
                {
                    id: 'laser_player_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .LASER_00,

                    kind:
                        SHIP_WEAPON_KIND.LASER,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,
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

                    loadedMissileId:
                        MISSILE_ID.RED_00,

                    ammoCount: 5,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,
                },
            ],
        });
    });
});
