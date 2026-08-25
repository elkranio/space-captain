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
    DEBUG_START,
} from '../../src/engine/content/catalogs/debug_start';
import {
    DEBUG_START_EQUIPMENT_TYPE,
} from '../../src/engine/content/schemas/debug_start';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_PHASE,
} from '../../src/engine/defs/ship_weapon';

describe('GameRuntime player ship weapons', () => {
    it('creates the configured Debug Start weapon slots with unique runtime ids', () => {
        const runtime =
            new GameRuntime();

        const weapons =
            runtime
                .getCurrentRun()
                .player
                .ship
                .weapons;

        expect(
            weapons.map(
                (weapon) =>
                    weapon.weaponId,
            ),
        ).toEqual(
            DEBUG_START.player
                .equipment
                .filter((equipment) => {
                    return (
                        equipment.type ===
                        DEBUG_START_EQUIPMENT_TYPE
                            .WEAPON
                    );
                })
                .map((equipment) => {
                    return equipment.equipmentId;
                }),
        );

        expect(
            new Set(
                weapons.map(
                    (weapon) =>
                        weapon.id,
                ),
            ).size,
        ).toBe(
            weapons.length,
        );

        for (
            const weapon of
            weapons
        ) {
            expect(weapon).toMatchObject({
                phase:
                    SHIP_WEAPON_PHASE
                        .READY,

                phaseElapsedMs: 0,
            });
        }
    });

    it('persists a detached mutable weapon-state snapshot', () => {
        const runtime =
            new GameRuntime();

        const currentWeapons =
            runtime
                .getCurrentRun()
                .player
                .ship
                .weapons;

        const weapon =
            currentWeapons[0];

        if (!weapon) {
            throw new Error(
                'Expected starter player weapon',
            );
        }

        const nextWeapon = {
            ...weapon,

            phase:
                SHIP_WEAPON_PHASE.COOLDOWN,

            phaseElapsedMs:
                1234,
        };

        const nextWeapons =
            currentWeapons.map(
                (candidate) => {
                    if (
                        candidate.id ===
                        weapon.id
                    ) {
                        return nextWeapon;
                    }

                    return {
                        ...candidate,
                    };
                },
            );

        runtime.setPlayerShipWeaponStates(
            nextWeapons,
        );

        expect(
            runtime
                .getCurrentRun()
                .player
                .ship
                .weapons[0],
        ).toEqual(nextWeapon);

        nextWeapon.phaseElapsedMs = 9999;

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

        const weapons =
            runtime
                .getCurrentRun()
                .player
                .ship
                .weapons;

        const weapon =
            weapons[0];

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
                .setPlayerShipWeaponStates(
                    weapons.map(
                        (candidate) => {
                            if (
                                candidate.id !==
                                weapon.id
                            ) {
                                return {
                                    ...candidate,
                                };
                            }

                            return {
                                ...candidate,

                                weaponId:
                                    weapon.weaponId ===
                                    SHIP_WEAPON_ID
                                        .MISSILE_LAUNCHER_00
                                        ? SHIP_WEAPON_ID
                                              .BEAM_CANNON_00
                                        : SHIP_WEAPON_ID
                                              .MISSILE_LAUNCHER_00,
                            };
                        },
                    ),
                );
        }).toThrow(
            'Player ship weapon definition cannot change',
        );
    });
});
