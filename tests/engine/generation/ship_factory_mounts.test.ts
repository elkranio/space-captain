import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_PRESET_ID,
    SHIP_PRESETS,
    type ShipPreset,
} from '../../../src/engine/content/presets/ships';
import {
    SHIP_WEAPON_KIND,
} from '../../../src/engine/defs/ship_weapon';
import ShipFactory from '../../../src/engine/generation/ship/ShipFactory';

describe(
    'ShipFactory chassis mounts',
    () => {
        it(
            'accepts every built-in ship preset layout',
            () => {
                for (
                    const preset of
                    Object.values(
                        SHIP_PRESETS,
                    )
                ) {
                    expect(() => {
                        ShipFactory
                            .validatePresetMounts(
                                preset,
                            );
                    }).not.toThrow();
                }
            },
        );

        it(
            'keeps validated spatial mounts in created ship state',
            () => {
                const ship =
                    ShipFactory.create({
                        presetId:
                            SHIP_PRESET_ID
                                .GENERIC_DEFENSE_SANDBOX_00,
                    });

                expect(ship.mounts).toEqual([
                    {
                        slotId: 'drive',
                        equipmentId: 'drive_00',
                    },
                    {
                        slotId: 'defense_01',
                        equipmentId:
                            'defense_turret_00',
                    },
                    {
                        slotId: 'defense_02',
                        equipmentId:
                            'shield_generator_00',
                    },
                    {
                        slotId: 'weapon_01',
                        equipmentId:
                            'missile_launcher_00',
                    },
                ]);

                expect(
                    ship.mounts.some((mount) => {
                        return (
                            mount.equipmentId ===
                            'power_core_00'
                        );
                    }),
                ).toBe(false);
            },
        );

        it(
            'rejects equipment mounted into an incompatible slot kind',
            () => {
                const source =
                    SHIP_PRESETS[
                        SHIP_PRESET_ID
                            .GENERIC_SPAM_00
                    ];

                const invalidPreset:
                    ShipPreset = {
                        ...source,

                        weapons:
                            source.weapons
                                .map((weapon) => {
                                    return {
                                        ...weapon,
                                        slotId:
                                            'weapon_01',
                                    };
                                }),
                    };

                expect(() => {
                    ShipFactory
                        .validatePresetMounts(
                            invalidPreset,
                        );
                }).toThrow(
                    'Ship equipment slot kind mismatch: spam_projector_00/utility -> weapon_01/weapon',
                );
            },
        );

        it(
            'rejects a weapon preset whose kind does not match its content id',
            () => {
                const source =
                    SHIP_PRESETS[
                        SHIP_PRESET_ID
                            .GENERIC_MISSILE_00
                    ];

                const invalidPreset:
                    ShipPreset = {
                        ...source,

                        weapons:
                            source.weapons
                                .map((weapon) => {
                                    return {
                                        ...weapon,
                                        kind:
                                            SHIP_WEAPON_KIND
                                                .BEAM_CANNON,
                                    };
                                }),
                    };

                expect(() => {
                    ShipFactory
                        .validatePresetMounts(
                            invalidPreset,
                        );
                }).toThrow(
                    (
                        'Ship preset weapon kind mismatch: ' +
                        'missile_launcher_00/beam_cannon -> ' +
                        'missile_launcher_00/missile_launcher'
                    ),
                );
            },
        );

        it(
            'rejects a mount that references a missing chassis slot',
            () => {
                const source =
                    SHIP_PRESETS[
                        SHIP_PRESET_ID
                            .GENERIC_MISSILE_00
                    ];

                const invalidPreset:
                    ShipPreset = {
                        ...source,

                        drive: {
                            ...source.drive,
                            slotId:
                                'missing_slot',
                        },
                    };

                expect(() => {
                    ShipFactory
                        .validatePresetMounts(
                            invalidPreset,
                        );
                }).toThrow(
                    'Ship equipment references missing chassis slot: drive_00/missing_slot',
                );
            },
        );

        it(
            'rejects multiple systems mounted into one chassis slot',
            () => {
                const source =
                    SHIP_PRESETS[
                        SHIP_PRESET_ID
                            .GENERIC_DEFENSE_SANDBOX_00
                    ];

                const invalidPreset:
                    ShipPreset = {
                        ...source,

                        shieldGenerator: {
                            ...source
                                .shieldGenerator,
                            slotId:
                                'defense_01',
                        },
                    };

                expect(() => {
                    ShipFactory
                        .validatePresetMounts(
                            invalidPreset,
                        );
                }).toThrow(
                    'Ship chassis slot is mounted more than once: defense_01',
                );
            },
        );
    },
);
