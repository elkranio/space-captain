import {
    describe,
    expect,
    it,
} from 'vitest';
import type {
    ShipPreset,
} from '../../../src/engine/content/presets/ships';
import { DEFENSE_TURRET_ID } from '../../../src/engine/defs/defense_turret';
import { POWER_CORE_ID } from '../../../src/engine/defs/power_core';
import { SHIP_CHASSIS_ID } from '../../../src/engine/defs/ship_chassis';
import { SHIP_DRIVE_ID } from '../../../src/engine/defs/ship_drive';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
} from '../../../src/engine/defs/ship_weapon';
import ShipFactory from '../../../src/engine/generation/ship/ShipFactory';


const MISSILE_TEST_PRESET = {
    id: 'test_missile',

    chassisId: SHIP_CHASSIS_ID.GENERIC_00,

    drive: {
        id: 'drive_00',
        slotId: 'drive',

        driveId: SHIP_DRIVE_ID.BASIC_00,
    },

    weapons: [
        {
            id: 'missile_launcher_00',
            slotId: 'weapon_01',

            kind:
                SHIP_WEAPON_KIND
                    .MISSILE_LAUNCHER,

            weaponId:
                SHIP_WEAPON_ID
                    .MISSILE_LAUNCHER_00,
        },
    ],
} satisfies ShipPreset;

const COMBAT_TEST_PRESET = {
    ...MISSILE_TEST_PRESET,

    id: 'test_combat',

    weapons: [
        ...MISSILE_TEST_PRESET.weapons,
        {
            id: 'beam_cannon_00',
            slotId: 'weapon_02',

            kind:
                SHIP_WEAPON_KIND
                    .BEAM_CANNON,

            weaponId:
                SHIP_WEAPON_ID
                    .BEAM_CANNON_00,
        },
    ],
} satisfies ShipPreset;

const DEFENSE_SANDBOX_TEST_PRESET = {
    id: 'test_defense_sandbox',

    chassisId: SHIP_CHASSIS_ID.GENERIC_00,

    drive: {
        id: 'drive_00',
        slotId: 'drive',

        driveId: SHIP_DRIVE_ID.BASIC_00,
    },

    defenseTurret: {
        id: 'defense_turret_00',
        slotId: 'defense_01',

        defenseTurretId: DEFENSE_TURRET_ID.BASIC_00,
    },

    powerCore: {
        id: 'power_core_00',
        slotId: 'power_core',

        powerCoreId: POWER_CORE_ID.BASIC_00,
    },

    weapons: [
        {
            id: 'missile_launcher_00',
            slotId: 'weapon_01',

            kind:
                SHIP_WEAPON_KIND
                    .MISSILE_LAUNCHER,

            weaponId:
                SHIP_WEAPON_ID
                    .MISSILE_LAUNCHER_00,
        },
    ],
} satisfies ShipPreset;

describe(
    'ShipFactory chassis mounts',
    () => {
        it(
            'accepts representative test preset layouts',
            () => {
                for (
                    const preset of [
                        MISSILE_TEST_PRESET,
                        COMBAT_TEST_PRESET,
                        DEFENSE_SANDBOX_TEST_PRESET,
                    ]
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
                    ShipFactory.createFromPreset(
                        DEFENSE_SANDBOX_TEST_PRESET,
                    );

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
                        slotId: 'power_core',
                        equipmentId:
                            'power_core_00',
                    },
                    {
                        slotId: 'weapon_01',
                        equipmentId:
                            'missile_launcher_00',
                    },
                ]);

            },
        );

        it(
            'allows the dedicated Power Core slot to stay empty',
            () => {
                const ship =
                    ShipFactory.createFromPreset(
                        MISSILE_TEST_PRESET,
                    );

                expect(ship.powerCore).toBeUndefined();
                expect(
                    ship.mounts.some((mount) => {
                        return mount.slotId === 'power_core';
                    }),
                ).toBe(false);
            },
        );

        it(
            'rejects a Power Core mounted outside its dedicated slot',
            () => {
                const source =
                    DEFENSE_SANDBOX_TEST_PRESET;

                const invalidPreset:
                    ShipPreset = {
                        ...source,

                        powerCore: {
                            ...source.powerCore,
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
                    'Ship equipment slot kind mismatch: power_core_00/power_core -> defense_01/defense',
                );
            },
        );

        it(
            'rejects equipment mounted into an incompatible slot kind',
            () => {
                const source =
                    MISSILE_TEST_PRESET;

                const invalidPreset:
                    ShipPreset = {
                        ...source,

                        weapons: [
                            {
                                id:
                                    'spam_projector_00',
                                slotId:
                                    'weapon_01',
                                kind:
                                    SHIP_WEAPON_KIND
                                        .SPAM_PROJECTOR,
                                weaponId:
                                    SHIP_WEAPON_ID
                                        .SPAM_PROJECTOR_00,
                            },
                        ],
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
                    MISSILE_TEST_PRESET;

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
                    MISSILE_TEST_PRESET;

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
                    COMBAT_TEST_PRESET;

                const invalidPreset:
                    ShipPreset = {
                        ...source,

                        weapons: source.weapons.map((weapon, index) => {
                            return index === 1
                                ? { ...weapon, slotId: 'weapon_01' }
                                : weapon;
                        }),
                    };

                expect(() => {
                    ShipFactory
                        .validatePresetMounts(
                            invalidPreset,
                        );
                }).toThrow(
                    'Ship chassis slot is mounted more than once: weapon_01',
                );
            },
        );
    },
);
