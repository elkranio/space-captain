// src/engine/content/presets/ships.ts

import type { ShipWeaponKind } from "../../defs/ship_weapon";

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
