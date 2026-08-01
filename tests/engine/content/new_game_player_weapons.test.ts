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

        if (
            !firstLaser ||
            !secondLaser ||
            !firstLauncher ||
            !secondLauncher ||
            firstLauncher.kind !==
                SHIP_WEAPON_KIND
                    .MISSILE_LAUNCHER ||
            secondLauncher.kind !==
                SHIP_WEAPON_KIND
                    .MISSILE_LAUNCHER
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

        firstLaser.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        firstLaser.phaseElapsedMs = 500;

        firstLauncher.ammoCount = 0;

        expect(secondLaser.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );

        expect(
            secondLaser.phaseElapsedMs,
        ).toBe(0);

        expect(
            secondLauncher.ammoCount,
        ).toBe(5);
    });
});
