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
    it('creates a fresh installed laser for every run', () => {
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
        ]);

        expect(
            firstRun.player.ship.weapons,
        ).not.toBe(
            secondRun.player.ship.weapons,
        );

        const firstWeapon =
            firstRun.player.ship.weapons[0];

        const secondWeapon =
            secondRun.player.ship.weapons[0];

        if (!firstWeapon || !secondWeapon) {
            throw new Error(
                'Expected installed player lasers',
            );
        }

        expect(firstWeapon).not.toBe(
            secondWeapon,
        );

        firstWeapon.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        firstWeapon.phaseElapsedMs = 500;

        expect(secondWeapon.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );

        expect(
            secondWeapon.phaseElapsedMs,
        ).toBe(0);
    });
});
