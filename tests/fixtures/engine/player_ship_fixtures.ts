// tests/fixtures/engine/player_ship_fixtures.ts

import {
    DEFENSE_TURRET_ID,
    type ShipDefenseTurretState,
} from '../../../src/engine/defs/defense_turret';
import type {
    PlayerHullState,
    PlayerShipState,
} from '../../../src/engine/defs/player';
import type {
    PowerCoreState,
} from '../../../src/engine/defs/power_core';
import {
    SHIP_CHASSIS_ID,
} from '../../../src/engine/defs/ship_chassis';
import type {
    ShipDriveState,
} from '../../../src/engine/defs/ship_drive';
import type {
    ShipEquipmentMountState,
} from '../../../src/engine/defs/ship_slot';
import type {
    ShipWeaponState,
} from '../../../src/engine/defs/ship_weapon';
import {
    SHIELD_GENERATOR_ID,
    type ShieldGeneratorState,
} from '../../../src/engine/defs/shield_generator';
import ShipDefenseTurretFactory from '../../../src/engine/generation/ship_system/ShipDefenseTurretFactory';
import ShieldGeneratorFactory from '../../../src/engine/generation/ship_system/ShieldGeneratorFactory';
import {
    createPlayerHullFixture,
} from './player_hull_fixtures';
import {
    createShipDriveFixture,
} from './ship_drive_fixtures';

export type PlayerShipFixtureOptions = {
    playerHull?: PlayerHullState;
    mounts?: ShipEquipmentMountState[];
    drive?: ShipDriveState;
    defenseTurret?: ShipDefenseTurretState;
    powerCore?: PowerCoreState;
    shieldGenerator?: ShieldGeneratorState;
    weapons?: ShipWeaponState[];
};

export function createPlayerShipFixture({
    playerHull = createPlayerHullFixture(),
    mounts = [],
    drive = createShipDriveFixture(),
    defenseTurret = ShipDefenseTurretFactory.create({
        id: 'defense_turret_player_00',
        defenseTurretId:
            DEFENSE_TURRET_ID.BASIC_00,
    }),
    powerCore,
    shieldGenerator = ShieldGeneratorFactory.create({
        id: 'shield_generator_player_00',
        shieldGeneratorId:
            SHIELD_GENERATOR_ID.BASIC_00,
    }),
    weapons = [],
}: PlayerShipFixtureOptions = {}): PlayerShipState {
    return {
        ...playerHull,

        chassisId:
            SHIP_CHASSIS_ID.PLAYER_00,

        mounts,

        drive,
        defenseTurret,

        ...(powerCore ? { powerCore } : {}),

        shieldGenerator,

        weapons,
    };
}
