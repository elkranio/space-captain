// tests/engine/content/new_game_player_weapons.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    DEBUG_START,
} from '../../../src/engine/content/catalogs/debug_start';
import {
    createNewRunState,
} from '../../../src/engine/generation/new_game/create_new_run_state';
import {
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';

describe('New-game player weapons', () => {
    it('creates fresh installed weapons from debug-start slots', () => {
        const first =
            createNewRunState()
                .player.ship.weapons;

        const second =
            createNewRunState()
                .player.ship.weapons;

        const expectedWeaponIds = [
            DEBUG_START.player
                .weaponSlot1Id,
            DEBUG_START.player
                .weaponSlot2Id,
            DEBUG_START.player
                .weaponSlot3Id,
            DEBUG_START.player
                .weaponSlot4Id,
        ];

        expect(
            first.map(
                (weapon) =>
                    weapon.weaponId,
            ),
        ).toEqual(
            expectedWeaponIds,
        );

        expect(
            second.map(
                (weapon) =>
                    weapon.weaponId,
            ),
        ).toEqual(
            expectedWeaponIds,
        );

        expect(first).not.toBe(second);

        for (
            let index = 0;
            index < first.length;
            index += 1
        ) {
            expect(
                first[index],
            ).not.toBe(
                second[index],
            );
        }

        const firstWeapon =
            first[0];

        const secondWeapon =
            second[0];

        if (
            !firstWeapon ||
            !secondWeapon
        ) {
            throw new Error(
                'Expected configured player weapon',
            );
        }

        firstWeapon.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        expect(secondWeapon.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
    });
});
