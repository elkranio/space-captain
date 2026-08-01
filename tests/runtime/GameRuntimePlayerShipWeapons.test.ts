// tests/runtime/GameRuntimePlayerShipWeapons.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_PHASE,
} from '../../src/engine/defs/ship_weapon';

describe('GameRuntime player ship weapons', () => {
    it('persists a detached mutable weapon-state snapshot', () => {
        const runtime =
            new GameRuntime();

        const weapon =
            runtime
                .getCurrentRun()
                .player
                .ship
                .weapons[0];

        if (!weapon) {
            throw new Error(
                'Expected starter player weapon',
            );
        }

        const next = {
            ...weapon,

            phase:
                SHIP_WEAPON_PHASE.COOLDOWN,

            phaseElapsedMs:
                1234,
        };

        runtime.setPlayerShipWeaponStates([
            next,
        ]);

        expect(
            runtime
                .getCurrentRun()
                .player
                .ship
                .weapons[0],
        ).toEqual(next);

        next.phaseElapsedMs = 9999;

        expect(
            runtime
                .getCurrentRun()
                .player
                .ship
                .weapons[0]
                ?.phaseElapsedMs,
        ).toBe(1234);
    });

    it('rejects player weapon loadout replacement', () => {
        const runtime =
            new GameRuntime();

        const weapon =
            runtime
                .getCurrentRun()
                .player
                .ship
                .weapons[0];

        if (!weapon) {
            throw new Error(
                'Expected starter player weapon',
            );
        }

        expect(() => {
            runtime
                .setPlayerShipWeaponStates(
                    [],
                );
        }).toThrow(
            'Player ship weapon count cannot change',
        );

        expect(() => {
            runtime
                .setPlayerShipWeaponStates([
                    {
                        ...weapon,

                        weaponId:
                            SHIP_WEAPON_ID
                                .MISSILE_LAUNCHER_00,
                    },
                ]);
        }).toThrow(
            'Player ship weapon definition cannot change',
        );
    });
});
