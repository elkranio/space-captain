// src/engine/content/presets/ships.ts

import { POWER_CORE_ID } from "../../defs/power_core";
import { SHIP_CHASSIS_ID } from "../../defs/ship_chassis";
import { SHIP_DRIVE_ID } from "../../defs/ship_drive";
import { DEFENSE_TURRET_ID } from "../../defs/defense_turret";
import { SHIP_WEAPON_ID, SHIP_WEAPON_KIND, type ShipWeaponKind } from "../../defs/ship_weapon";

export const SHIP_PRESET_ID = {
    GENERIC_MISSILE_00: "generic_missile_00",

    GENERIC_BEAM_CANNON_00: "generic_beam_cannon_00",

    GENERIC_COMBAT_00: "generic_combat_00",

    GENERIC_DEFENSE_SANDBOX_00: "generic_defense_sandbox_00",
} as const;

export type ShipPresetId = (typeof SHIP_PRESET_ID)[keyof typeof SHIP_PRESET_ID];

export type ShipWeaponPreset = {
    // Runtime id установленного оружия внутри корабля.
    id: string;

    slotId: string;

    kind: ShipWeaponKind;
    weaponId: string;
};

export type ShipPreset = {
    id: string;

    chassisId: string;

    drive: {
        // Runtime id установленного двигателя.
        id: string;
        slotId: string;

        driveId: string;
    };

    // Optional installed defensive system.
    // Runtime state is created by ShipDefenseTurretFactory.
    defenseTurret?: {
        id: string;
        slotId: string;

        defenseTurretId: string;
    };

    powerCore?: {
        id: string;
        slotId: string;

        powerCoreId: string;
    };

    shieldGenerator?: {
        id: string;
        slotId: string;

        shieldGeneratorId: string;
    };

    weapons: ShipWeaponPreset[];
};

export const SHIP_PRESETS = {
    [SHIP_PRESET_ID.GENERIC_MISSILE_00]: {
        id: SHIP_PRESET_ID.GENERIC_MISSILE_00,

        chassisId: SHIP_CHASSIS_ID.GENERIC_00,

        drive: {
            id: "drive_00",
            slotId: "drive",

            driveId: SHIP_DRIVE_ID.BASIC_00,
        },

        weapons: [
            {
                id: "missile_launcher_00",
                slotId: "weapon_01",

                kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

                weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,
            },
        ],
    },

    [SHIP_PRESET_ID.GENERIC_BEAM_CANNON_00]: {
        id: SHIP_PRESET_ID.GENERIC_BEAM_CANNON_00,

        chassisId: SHIP_CHASSIS_ID.GENERIC_00,

        drive: {
            id: "drive_00",
            slotId: "drive",

            driveId: SHIP_DRIVE_ID.BASIC_00,
        },

        weapons: [
            {
                id: "beam_cannon_00",
                slotId: "weapon_01",

                kind: SHIP_WEAPON_KIND.BEAM_CANNON,

                weaponId: SHIP_WEAPON_ID.BEAM_CANNON_00,
            },
        ],
    },

    [SHIP_PRESET_ID.GENERIC_COMBAT_00]: {
        id: SHIP_PRESET_ID.GENERIC_COMBAT_00,

        chassisId: SHIP_CHASSIS_ID.GENERIC_00,

        drive: {
            id: "drive_00",
            slotId: "drive",

            driveId: SHIP_DRIVE_ID.BASIC_00,
        },

        weapons: [
            {
                id: "missile_launcher_00",
                slotId: "weapon_01",

                kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

                weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,
            },
            {
                id: "beam_cannon_00",
                slotId: "weapon_02",

                kind: SHIP_WEAPON_KIND.BEAM_CANNON,

                weaponId: SHIP_WEAPON_ID.BEAM_CANNON_00,
            },
            {
                id: "spam_projector_00",
                slotId: "utility_01",

                kind: SHIP_WEAPON_KIND.SPAM_PROJECTOR,

                weaponId: SHIP_WEAPON_ID.SPAM_PROJECTOR_00,
            },
        ],
    },

    [SHIP_PRESET_ID.GENERIC_DEFENSE_SANDBOX_00]: {
        id: SHIP_PRESET_ID.GENERIC_DEFENSE_SANDBOX_00,

        chassisId: SHIP_CHASSIS_ID.GENERIC_00,

        drive: {
            id: "drive_00",
            slotId: "drive",

            driveId: SHIP_DRIVE_ID.BASIC_00,
        },

        defenseTurret: {
            id: "defense_turret_00",
            slotId: "defense_01",

            defenseTurretId: DEFENSE_TURRET_ID.BASIC_00,
        },

        powerCore: {
            id: "power_core_00",
            slotId: "power_core",

            powerCoreId: POWER_CORE_ID.BASIC_00,
        },

        // Runtime smoke/combat sandbox keeps the defensive turret
        // and mounts one normal missile launcher so both missile
        // directions can be exercised in the real new-game encounter.
        weapons: [
            {
                id: "missile_launcher_00",
                slotId: "weapon_01",

                kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

                weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,
            },
        ],
    },
} satisfies Record<ShipPresetId, ShipPreset>;
