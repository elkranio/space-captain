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


                ammoCount: 6,

                phase:
                    SHIP_WEAPON_PHASE.READY,

                phaseElapsedMs: 0,

                dispensedMineCount: 0,
            },

            {
                id:
                    'spam_projector_player_00',

                weaponId:
                    SHIP_WEAPON_ID
                        .SPAM_PROJECTOR_00,

                kind:
                    SHIP_WEAPON_KIND
                        .SPAM_PROJECTOR,

                phase:
                    SHIP_WEAPON_PHASE.READY,

                phaseElapsedMs: 0,

                activeChannelId: null,
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

        const firstProjector =
            firstRun.player.ship.weapons[3];

        const secondProjector =
            secondRun.player.ship.weapons[3];

        if (
            !firstLaser ||
            !secondLaser ||
            !firstLauncher ||
            !secondLauncher ||
            !firstDispenser ||
            !secondDispenser ||
            !firstProjector ||
            !secondProjector ||
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
                    .STICKY_MINE_DISPENSER ||
            firstProjector.kind !==
                SHIP_WEAPON_KIND
                    .SPAM_PROJECTOR ||
            secondProjector.kind !==
                SHIP_WEAPON_KIND
                    .SPAM_PROJECTOR
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

        expect(firstProjector).not.toBe(
            secondProjector,
        );

        firstLaser.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        firstLaser.phaseElapsedMs = 500;

        firstLauncher.ammoCount = 0;

        firstDispenser.ammoCount = 0;
        firstDispenser.dispensedMineCount = 2;

        firstProjector.phase =
            SHIP_WEAPON_PHASE.CHANNELING;

        firstProjector.phaseElapsedMs =
            4000;

        firstProjector.activeChannelId =
            'player_spam:test';

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

        expect(
            secondProjector.phase,
        ).toBe(
            SHIP_WEAPON_PHASE.READY,
        );

        expect(
            secondProjector
                .phaseElapsedMs,
        ).toBe(0);

        expect(
            secondProjector
                .activeChannelId,
        ).toBeNull();
    });
});
