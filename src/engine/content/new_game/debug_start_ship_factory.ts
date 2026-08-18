// src/engine/content/new_game/debug_start_ship_factory.ts

import { DEBUG_START } from "../catalogs/debug_start";
import { SHIP_CHASSIS } from "../catalogs/ship_chassis";
import { SHIP_DRIVES } from "../catalogs/ship_drives";
import { SHIP_WEAPONS } from "../catalogs/ship_weapons";
import type { PlayerShipState } from "../../defs/player";
import { SHIP_DRIVE_STATUS } from "../../defs/ship_drive";
import { SHIP_WEAPON_KIND, type ShipWeaponKind, type ShipWeaponState } from "../../defs/ship_weapon";
import PowerCoreFactory from "../../generation/ship_system/PowerCoreFactory";
import ShipDefenseTurretFactory from "../../generation/ship_system/ShipDefenseTurretFactory";
import ShieldGeneratorFactory from "../../generation/ship_system/ShieldGeneratorFactory";
import type { CreatedShipState } from "../../generation/ship/ShipFactory";
import BeamCannonFactory from "../../generation/ship_weapon/BeamCannonFactory";
import MissileLauncherFactory from "../../generation/ship_weapon/MissileLauncherFactory";
import SpamProjectorFactory from "../../generation/ship_weapon/SpamProjectorFactory";
import StickyMineDispenserFactory from "../../generation/ship_weapon/StickyMineDispenserFactory";

const DEBUG_START_SYSTEM_ID = {
    PLAYER: {
        DRIVE: "drive_player_00",

        DEFENSE_TURRET: "defense_turret_player_00",

        POWER_CORE: "power_core_player_00",

        SHIELD_GENERATOR: "shield_generator_player_00",
    },

    ENEMY: {
        DRIVE: "drive_00",

        DEFENSE_TURRET: "defense_turret_00",

        POWER_CORE: "power_core_00",

        SHIELD_GENERATOR: "shield_generator_00",
    },
} as const;

type DebugStartShipSide = "player" | "enemy";

export function createDebugStartPlayerShip(): PlayerShipState {
    const config = DEBUG_START.player;

    const drive = SHIP_DRIVES[config.driveId];

    return {
        hull: config.maxHull,
        maxHull: config.maxHull,

        drive: {
            id: DEBUG_START_SYSTEM_ID.PLAYER.DRIVE,

            driveId: drive.id,

            status: SHIP_DRIVE_STATUS.ONLINE,
        },

        defenseTurret: ShipDefenseTurretFactory.create({
            id: DEBUG_START_SYSTEM_ID.PLAYER.DEFENSE_TURRET,

            defenseTurretId: config.defenseTurretId,
        }),

        powerCore: PowerCoreFactory.create({
            id: DEBUG_START_SYSTEM_ID.PLAYER.POWER_CORE,

            powerCoreId: config.powerCoreId,
        }),

        shieldGenerator: ShieldGeneratorFactory.create({
            id: DEBUG_START_SYSTEM_ID.PLAYER.SHIELD_GENERATOR,

            shieldGeneratorId: config.shieldGeneratorId,
        }),

        weapons: createInstalledWeapons(
            [config.weaponSlot1Id, config.weaponSlot2Id, config.weaponSlot3Id, config.weaponSlot4Id],
            "player",
        ),
    };
}

export function createDebugStartEnemyShip(): CreatedShipState {
    const config = DEBUG_START.enemy;

    const chassis = SHIP_CHASSIS[config.chassisId];

    const drive = SHIP_DRIVES[config.driveId];

    const weaponIds = [config.weaponSlot1Id, config.weaponSlot2Id, config.weaponSlot3Id, config.weaponSlot4Id].filter(
        (weaponId): weaponId is string => weaponId !== null,
    );

    return {
        chassisId: chassis.id,

        hull: chassis.maxHull,
        maxHull: chassis.maxHull,

        drive: {
            id: DEBUG_START_SYSTEM_ID.ENEMY.DRIVE,

            driveId: drive.id,

            status: SHIP_DRIVE_STATUS.ONLINE,
        },

        ...(config.defenseTurretId === null
            ? {}
            : {
                  defenseTurret: ShipDefenseTurretFactory.create({
                      id: DEBUG_START_SYSTEM_ID.ENEMY.DEFENSE_TURRET,

                      defenseTurretId: config.defenseTurretId,
                  }),
              }),

        ...(config.powerCoreId === null
            ? {}
            : {
                  powerCore: PowerCoreFactory.create({
                      id: DEBUG_START_SYSTEM_ID.ENEMY.POWER_CORE,

                      powerCoreId: config.powerCoreId,
                  }),
              }),

        ...(config.shieldGeneratorId === null
            ? {}
            : {
                  shieldGenerator: ShieldGeneratorFactory.create({
                      id: DEBUG_START_SYSTEM_ID.ENEMY.SHIELD_GENERATOR,

                      shieldGeneratorId: config.shieldGeneratorId,
                  }),
              }),

        weapons: createInstalledWeapons(weaponIds, "enemy"),
    };
}

function createInstalledWeapons(weaponIds: string[], side: DebugStartShipSide): ShipWeaponState[] {
    const occurrenceByKind: Partial<Record<ShipWeaponKind, number>> = {};

    return weaponIds.map((weaponId) => {
        const definition = SHIP_WEAPONS[weaponId];

        const occurrence = occurrenceByKind[definition.kind] ?? 0;

        occurrenceByKind[definition.kind] = occurrence + 1;

        const runtimeId = createWeaponRuntimeId(definition.kind, side, occurrence);

        switch (definition.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                return MissileLauncherFactory.create({
                    id: runtimeId,
                    weaponId,
                });

            case SHIP_WEAPON_KIND.BEAM_CANNON:
                return BeamCannonFactory.create({
                    id: runtimeId,
                    weaponId,
                });

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                return SpamProjectorFactory.create({
                    id: runtimeId,
                    weaponId,
                });

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                return StickyMineDispenserFactory.create({
                    id: runtimeId,
                    weaponId,
                });

            default:
                return assertNever(definition);
        }
    });
}

function createWeaponRuntimeId(kind: ShipWeaponKind, side: DebugStartShipSide, occurrence: number): string {
    const suffix = String(occurrence).padStart(2, "0");

    if (side === "player") {
        return kind + "_player_" + suffix;
    }

    return kind + "_" + suffix;
}

function assertNever(value: never): never {
    throw new Error("Unhandled debug-start weapon definition: " + JSON.stringify(value));
}
