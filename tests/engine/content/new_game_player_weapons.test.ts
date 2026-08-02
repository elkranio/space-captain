// tests/engine/content/new_game_player_weapons.test.ts

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
    STICKY_MINE_ID,
} from '../../../src/engine/defs/sticky_mine';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';

describe('New-game player weapons', () => {
    it('creates fresh installed weapons for every run', () => {
        const firstRun =
            createNewRunState();

        const secondRun =
            createNewRunState();

        expect(
            firstRun.player.ship.weapons,
        ).toEqual([
            {
                id: 'laser_player_00',

                weaponId:
                    SHIP_WEAPON_ID.LASER_00,

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

            {
                id:
                    'sticky_mine_dispenser_player_00',

                weaponId:
                    SHIP_WEAPON_ID
                        .STICKY_MINE_DISPENSER_00,

                kind:
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER,

                loadedMineId:
                    STICKY_MINE_ID.BASIC_00,

                ammoCount: 6,

                phase:
                    SHIP_WEAPON_PHASE.READY,

                phaseElapsedMs: 0,

                dispensedMineCount: 0,
            },
        ]);

        expect(
            firstRun.player.ship.weapons,
        ).not.toBe(
            secondRun.player.ship.weapons,
        );

        const firstLaser =
            firstRun.player.ship.weapons[0];

        const secondLaser =
            secondRun.player.ship.weapons[0];

        const firstLauncher =
            firstRun.player.ship.weapons[1];

        const secondLauncher =
            secondRun.player.ship.weapons[1];

        const firstDispenser =
            firstRun.player.ship.weapons[2];

        const secondDispenser =
            secondRun.player.ship.weapons[2];

        if (
            !firstLaser ||
            !secondLaser ||
            !firstLauncher ||
            !secondLauncher ||
            !firstDispenser ||
            !secondDispenser ||
            firstLauncher.kind !==
                SHIP_WEAPON_KIND
                    .MISSILE_LAUNCHER ||
            secondLauncher.kind !==
                SHIP_WEAPON_KIND
                    .MISSILE_LAUNCHER ||
            firstDispenser.kind !==
                SHIP_WEAPON_KIND
                    .STICKY_MINE_DISPENSER ||
            secondDispenser.kind !==
                SHIP_WEAPON_KIND
                    .STICKY_MINE_DISPENSER
        ) {
            throw new Error(
                'Expected installed player weapons',
            );
        }

        expect(firstLaser).not.toBe(
            secondLaser,
        );

        expect(firstLauncher).not.toBe(
            secondLauncher,
        );

        expect(firstDispenser).not.toBe(
            secondDispenser,
        );

        firstLaser.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        firstLaser.phaseElapsedMs = 500;

        firstLauncher.ammoCount = 0;

        firstDispenser.ammoCount = 0;
        firstDispenser.dispensedMineCount = 2;

        expect(secondLaser.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );

        expect(
            secondLaser.phaseElapsedMs,
        ).toBe(0);

        expect(
            secondLauncher.ammoCount,
        ).toBe(5);

        expect(
            secondDispenser.ammoCount,
        ).toBe(6);

        expect(
            secondDispenser
                .dispensedMineCount,
        ).toBe(0);
    });
});
