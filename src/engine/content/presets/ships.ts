// src/engine/content/presets/ships.ts

import {
    SHIP_CHASSIS_ID,
    type ShipChassisId,
} from '../../defs/ship_chassis';
import {
    SHIP_DRIVE_ID,
    type ShipDriveId,
} from '../../defs/ship_drive';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
} from '../../defs/ship_weapon';
import {
    MISSILE_LAUNCHER_PRESET_ID,
    type MissileLauncherPresetId,
} from './missile_launchers';
import {
    STICKY_MINE_DISPENSER_PRESET_ID,
    type StickyMineDispenserPresetId,
} from './sticky_mine_dispensers';
import {
    SHIELD_GENERATOR_PRESET_ID,
    type ShieldGeneratorPresetId,
} from './shield_generators';

export const SHIP_PRESET_ID = {
    GENERIC_MISSILE_RED_00:
        'generic_missile_red_00',

    GENERIC_MISSILE_BLUE_00:
        'generic_missile_blue_00',

    GENERIC_LASER_00:
        'generic_laser_00',

    GENERIC_SPAM_00:
        'generic_spam_00',

    GENERIC_STICKY_MINES_00:
        'generic_sticky_mines_00',

    GENERIC_COMBAT_00:
        'generic_combat_00',

    GENERIC_DEFENSE_SANDBOX_00:
        'generic_defense_sandbox_00',
} as const;

export type ShipPresetId = (typeof SHIP_PRESET_ID)[keyof typeof SHIP_PRESET_ID];

type MissileLauncherShipWeaponPreset = {
    // Runtime id установленного оружия внутри корабля.
    id: string;

    kind:
        typeof SHIP_WEAPON_KIND.MISSILE_LAUNCHER;

    presetId: MissileLauncherPresetId;
};

type LaserShipWeaponPreset = {
    // Runtime id установленного оружия внутри корабля.
    id: string;

    kind: typeof SHIP_WEAPON_KIND.LASER;

    weaponId: typeof SHIP_WEAPON_ID.LASER_00;
};

type SpamProjectorShipWeaponPreset = {
    // Runtime id установленного оружия внутри корабля.
    id: string;

    kind:
        typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;

    weaponId:
        typeof SHIP_WEAPON_ID.SPAM_PROJECTOR_00;
};

type StickyMineDispenserShipWeaponPreset = {
    // Runtime id установленного оружия внутри корабля.
    id: string;

    kind:
        typeof SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER;

    presetId:
        StickyMineDispenserPresetId;
};

export type ShipWeaponPreset =
    | MissileLauncherShipWeaponPreset
    | LaserShipWeaponPreset
    | SpamProjectorShipWeaponPreset
    | StickyMineDispenserShipWeaponPreset;

export type ShipPreset = {
    id: ShipPresetId;

    chassisId: ShipChassisId;

    drive: {
        // Runtime id установленного двигателя.
        id: string;

        driveId: ShipDriveId;
    };

    shieldGeneratorPresetId:
        ShieldGeneratorPresetId;

    weapons: ShipWeaponPreset[];
};

export const SHIP_PRESETS = {
    [SHIP_PRESET_ID.GENERIC_MISSILE_RED_00]: {
        id:
            SHIP_PRESET_ID
                .GENERIC_MISSILE_RED_00,

        chassisId:
            SHIP_CHASSIS_ID.GENERIC_00,

        drive: {
            id: 'drive_00',
            driveId: SHIP_DRIVE_ID.BASIC_00,
        },

        shieldGeneratorPresetId:
            SHIELD_GENERATOR_PRESET_ID.BASIC_00,

        weapons: [
            {
                id: 'missile_launcher_00',

                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,

                presetId:
                    MISSILE_LAUNCHER_PRESET_ID
                        .BASIC_RED_FULL_00,
            },
        ],
    },

    [SHIP_PRESET_ID.GENERIC_MISSILE_BLUE_00]: {
        id:
            SHIP_PRESET_ID
                .GENERIC_MISSILE_BLUE_00,

        chassisId:
            SHIP_CHASSIS_ID.GENERIC_00,

        drive: {
            id: 'drive_00',
            driveId: SHIP_DRIVE_ID.BASIC_00,
        },

        shieldGeneratorPresetId:
            SHIELD_GENERATOR_PRESET_ID.BASIC_00,

        weapons: [
            {
                id: 'missile_launcher_00',

                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,

                presetId:
                    MISSILE_LAUNCHER_PRESET_ID
                        .BASIC_BLUE_FULL_00,
            },
        ],
    },

    [SHIP_PRESET_ID.GENERIC_LASER_00]: {
        id:
            SHIP_PRESET_ID
                .GENERIC_LASER_00,

        chassisId:
            SHIP_CHASSIS_ID.GENERIC_00,

        drive: {
            id: 'drive_00',
            driveId: SHIP_DRIVE_ID.BASIC_00,
        },

        shieldGeneratorPresetId:
            SHIELD_GENERATOR_PRESET_ID.BASIC_00,

        weapons: [
            {
                id: 'laser_00',

                kind: SHIP_WEAPON_KIND.LASER,

                weaponId:
                    SHIP_WEAPON_ID.LASER_00,
            },
        ],
    },

    [SHIP_PRESET_ID.GENERIC_SPAM_00]: {
        id:
            SHIP_PRESET_ID
                .GENERIC_SPAM_00,

        chassisId:
            SHIP_CHASSIS_ID.GENERIC_00,

        drive: {
            id: 'drive_00',
            driveId: SHIP_DRIVE_ID.BASIC_00,
        },

        shieldGeneratorPresetId:
            SHIELD_GENERATOR_PRESET_ID.BASIC_00,

        weapons: [
            {
                id: 'spam_projector_00',

                kind:
                    SHIP_WEAPON_KIND
                        .SPAM_PROJECTOR,

                weaponId:
                    SHIP_WEAPON_ID
                        .SPAM_PROJECTOR_00,
            },
        ],
    },

    [SHIP_PRESET_ID.GENERIC_STICKY_MINES_00]: {
        id:
            SHIP_PRESET_ID
                .GENERIC_STICKY_MINES_00,

        chassisId:
            SHIP_CHASSIS_ID.GENERIC_00,

        drive: {
            id: 'drive_00',
            driveId: SHIP_DRIVE_ID.BASIC_00,
        },

        shieldGeneratorPresetId:
            SHIELD_GENERATOR_PRESET_ID.BASIC_00,

        weapons: [
            {
                id:
                    'sticky_mine_dispenser_00',

                kind:
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER,

                presetId:
                    STICKY_MINE_DISPENSER_PRESET_ID
                        .BASIC_FULL_00,
            },
        ],
    },

    [SHIP_PRESET_ID.GENERIC_COMBAT_00]: {
        id:
            SHIP_PRESET_ID
                .GENERIC_COMBAT_00,

        chassisId:
            SHIP_CHASSIS_ID.GENERIC_00,

        drive: {
            id: 'drive_00',
            driveId: SHIP_DRIVE_ID.BASIC_00,
        },

        shieldGeneratorPresetId:
            SHIELD_GENERATOR_PRESET_ID.BASIC_00,

        weapons: [
            {
                id: 'missile_launcher_00',

                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,

                presetId:
                    MISSILE_LAUNCHER_PRESET_ID
                        .BASIC_RED_FULL_00,
            },
            {
                id: 'laser_00',

                kind: SHIP_WEAPON_KIND.LASER,

                weaponId:
                    SHIP_WEAPON_ID.LASER_00,
            },
            {
                id:
                    'sticky_mine_dispenser_00',

                kind:
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER,

                presetId:
                    STICKY_MINE_DISPENSER_PRESET_ID
                        .BASIC_FULL_00,
            },
            {
                id: 'spam_projector_00',

                kind:
                    SHIP_WEAPON_KIND
                        .SPAM_PROJECTOR,

                weaponId:
                    SHIP_WEAPON_ID
                        .SPAM_PROJECTOR_00,
            },
        ],
    },

    [SHIP_PRESET_ID.GENERIC_DEFENSE_SANDBOX_00]: {
        id:
            SHIP_PRESET_ID
                .GENERIC_DEFENSE_SANDBOX_00,

        chassisId:
            SHIP_CHASSIS_ID.GENERIC_00,

        drive: {
            id: 'drive_00',
            driveId: SHIP_DRIVE_ID.BASIC_00,
        },

        shieldGeneratorPresetId:
            SHIELD_GENERATOR_PRESET_ID.BASIC_00,

        // Defensive systems are added in later focused atoms.
        // This sandbox intentionally cannot schedule offensive work.
        weapons: [],
    },
} satisfies Record<ShipPresetId, ShipPreset>;
