// src/engine/content/presets/ships.ts

import {
    POWER_CORE_ID,
    type PowerCoreId,
} from '../../defs/power_core';
import {
    SHIP_CHASSIS_ID,
    type ShipChassisId,
} from '../../defs/ship_chassis';
import {
    SHIP_DRIVE_ID,
    type ShipDriveId,
} from '../../defs/ship_drive';
import {
    DEFENSE_TURRET_ID,
    type DefenseTurretId,
} from '../../defs/defense_turret';
import {
    SHIELD_GENERATOR_ID,
    type ShieldGeneratorId,
} from '../../defs/shield_generator';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
} from '../../defs/ship_weapon';

export const SHIP_PRESET_ID = {
    GENERIC_MISSILE_00:
        'generic_missile_00',

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

    weaponId:
        typeof SHIP_WEAPON_ID
            .MISSILE_LAUNCHER_00;
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

    weaponId:
        typeof SHIP_WEAPON_ID
            .STICKY_MINE_DISPENSER_00;
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

    // Optional installed defensive system.
    // Runtime state is created by ShipDefenseTurretFactory.
    defenseTurret?: {
        id: string;
        defenseTurretId: DefenseTurretId;
    };

    powerCore?: {
        id: string;

        powerCoreId:
            PowerCoreId;
    };

    shieldGenerator?: {
        id: string;

        shieldGeneratorId:
            ShieldGeneratorId;
    };

    weapons: ShipWeaponPreset[];
};

export const SHIP_PRESETS = {
    [SHIP_PRESET_ID.GENERIC_MISSILE_00]: {
        id:
            SHIP_PRESET_ID
                .GENERIC_MISSILE_00,

        chassisId:
            SHIP_CHASSIS_ID.GENERIC_00,

        drive: {
            id: 'drive_00',
            driveId: SHIP_DRIVE_ID.BASIC_00,
        },

        weapons: [
            {
                id: 'missile_launcher_00',

                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,

                weaponId:
                    SHIP_WEAPON_ID
                        .MISSILE_LAUNCHER_00,
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

        weapons: [
            {
                id:
                    'sticky_mine_dispenser_00',

                kind:
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER,

                weaponId:
                    SHIP_WEAPON_ID
                        .STICKY_MINE_DISPENSER_00,
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

        weapons: [
            {
                id: 'missile_launcher_00',

                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,

                weaponId:
                    SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,
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

                weaponId:
                    SHIP_WEAPON_ID
                        .STICKY_MINE_DISPENSER_00,
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

        defenseTurret: {
            id: 'defense_turret_00',
            defenseTurretId:
                DEFENSE_TURRET_ID.BASIC_00,
        },

        powerCore: {
            id:
                'power_core_00',

            powerCoreId:
                POWER_CORE_ID
                    .BASIC_00,
        },

        shieldGenerator: {
            id:
                'shield_generator_00',

            shieldGeneratorId:
                SHIELD_GENERATOR_ID
                    .BASIC_00,
        },

        // Runtime smoke/combat sandbox keeps the defensive stack
        // and mounts one normal missile launcher so both missile
        // directions can be exercised in the real new-game encounter.
        weapons: [
            {
                id:
                    'missile_launcher_00',

                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,

                weaponId:
                    SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,
            },
        ],
    },
} satisfies Record<ShipPresetId, ShipPreset>;
