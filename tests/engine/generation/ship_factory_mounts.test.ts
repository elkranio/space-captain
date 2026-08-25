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
