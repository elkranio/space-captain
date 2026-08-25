// src/engine/defs/player.ts

import type { PowerCoreState } from "./power_core";
import type { ShipDefenseTurretState } from "./defense_turret";
import type { PlayerLocationState } from "./player_location";
import type { ShipDriveState } from "./ship_drive";
import type { ShipEquipmentMountState } from "./ship_slot";
import type { ShipWeaponState } from "./ship_weapon";
import type { ShieldGeneratorState } from "./shield_generator";

export type PlayerHullState = {
    hull: number;
    maxHull: number;
};

export type PlayerHullDamageResult = {
    appliedDamage: number;
    remainingHull: number;
    destroyed: boolean;
};

export type PlayerShipState = PlayerHullState & {
    chassisId: string;

    mounts: ShipEquipmentMountState[];

    drive: ShipDriveState;

    defenseTurret: ShipDefenseTurretState;

    powerCore: PowerCoreState;

    shieldGenerator: ShieldGeneratorState;

    weapons: ShipWeaponState[];
};

export type PlayerState = {
    ship: PlayerShipState;
    location: PlayerLocationState;
};
