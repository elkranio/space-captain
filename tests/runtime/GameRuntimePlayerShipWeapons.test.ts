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
    SHIP_WEAPONS,
} from '../../src/engine/content/catalogs/ship_weapons';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../src/engine/defs/ship_weapon';

describe('GameRuntime player ship weapons', () => {
    it('creates a fully loaded starter missile launcher', () => {
        const runtime =
            new GameRuntime();

        const launcher =
            runtime
                .getCurrentRun()
                .player
                .ship
                .weapons
                .find((weapon) => {
                    return (
                        weapon.kind ===
                        SHIP_WEAPON_KIND
                            .MISSILE_LAUNCHER
                    );
                });

        if (
            !launcher ||
            launcher.kind !==
                SHIP_WEAPON_KIND
                    .MISSILE_LAUNCHER
        ) {
            throw new Error(
                'Expected starter missile launcher',
            );
        }

        const definition =
            SHIP_WEAPONS[
                launcher.weaponId
            ];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER
        ) {
            throw new Error(
                'Expected missile launcher definition',
            );
        }

        expect(launcher).toMatchObject({
            id:
                'missile_launcher_player_00',

            weaponId:
                SHIP_WEAPON_ID
                    .MISSILE_LAUNCHER_00,

            phase:
                SHIP_WEAPON_PHASE.READY,

            phaseElapsedMs: 0,



            ammoCount:
                definition.ammoCapacity,
        });
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
                                    SHIP_WEAPON_ID
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
