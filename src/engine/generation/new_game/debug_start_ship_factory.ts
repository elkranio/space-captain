// src/engine/generation/new_game/debug_start_ship_factory.ts

import { DEBUG_START } from "../../content/catalogs/debug_start";
import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import type { ShipPreset, ShipWeaponPreset } from "../../content/presets/ships";
import {
    DEBUG_START_EQUIPMENT_TYPE,
    type DebugStartData,
} from "../../content/schemas/debug_start";
import type { PlayerShipState } from "../../defs/player";
import { SHIP_WEAPON_KIND, type ShipWeaponKind } from "../../defs/ship_weapon";
import ShipFactory, { type CreatedShipState } from "../ship/ShipFactory";

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
type DebugStartShipConfig = DebugStartData["player"] | DebugStartData["enemy"];

export function createDebugStartPlayerShip(): PlayerShipState {
    const ship = ShipFactory.createFromPreset(createDebugStartPreset("player", DEBUG_START.player));

    if (!ship.defenseTurret || !ship.powerCore || !ship.shieldGenerator) {
        throw new Error("Debug Start player ship is missing required equipment.");
    }

    return {
        ...ship,

        defenseTurret: ship.defenseTurret,
        powerCore: ship.powerCore,
        shieldGenerator: ship.shieldGenerator,
    };
}

export function createDebugStartEnemyShip(): CreatedShipState {
    return ShipFactory.createFromPreset(createDebugStartPreset("enemy", DEBUG_START.enemy));
}

function createDebugStartPreset(side: DebugStartShipSide, config: DebugStartShipConfig): ShipPreset {
    const systemIds = side === "player" ? DEBUG_START_SYSTEM_ID.PLAYER : DEBUG_START_SYSTEM_ID.ENEMY;

    let drive: ShipPreset["drive"] | undefined;
    let defenseTurret: ShipPreset["defenseTurret"];
    let shieldGenerator: ShipPreset["shieldGenerator"];

    const weapons: ShipWeaponPreset[] = [];
    const occurrenceByKind: Partial<Record<ShipWeaponKind, number>> = {};

    for (const equipment of config.equipment) {
        switch (equipment.type) {
            case DEBUG_START_EQUIPMENT_TYPE.DRIVE:
                if (drive) {
                    throw new Error("Debug Start " + side + " has multiple Drive entries.");
                }

                drive = {
                    id: systemIds.DRIVE,
                    slotId: equipment.slotId,
                    driveId: equipment.equipmentId,
                };
                break;

            case DEBUG_START_EQUIPMENT_TYPE.DEFENSE_TURRET:
                if (defenseTurret) {
                    throw new Error("Debug Start " + side + " has multiple Defense Turret entries.");
                }

                defenseTurret = {
                    id: systemIds.DEFENSE_TURRET,
                    slotId: equipment.slotId,
                    defenseTurretId: equipment.equipmentId,
                };
                break;

            case DEBUG_START_EQUIPMENT_TYPE.SHIELD_GENERATOR:
                if (shieldGenerator) {
                    throw new Error("Debug Start " + side + " has multiple Shield Generator entries.");
                }

                shieldGenerator = {
                    id: systemIds.SHIELD_GENERATOR,
                    slotId: equipment.slotId,
                    shieldGeneratorId: equipment.equipmentId,
                };
                break;

            case DEBUG_START_EQUIPMENT_TYPE.WEAPON:
                weapons.push(
                    createDebugStartWeaponPreset(
                        equipment.equipmentId,
                        equipment.slotId,
                        side,
                        occurrenceByKind,
                    ),
                );
                break;
        }
    }

    if (!drive) {
        throw new Error("Debug Start " + side + " is missing Drive equipment.");
    }

    return {
        id: "debug_start_" + side,
        chassisId: config.chassisId,

        drive,

        ...(defenseTurret ? { defenseTurret } : {}),

        ...(config.powerCoreId === null
            ? {}
            : {
                  powerCore: {
                      id: systemIds.POWER_CORE,
                      powerCoreId: config.powerCoreId,
                  },
              }),

        ...(shieldGenerator ? { shieldGenerator } : {}),

        weapons,
    };
}

function createDebugStartWeaponPreset(
    weaponId: string,
    slotId: string,
    side: DebugStartShipSide,
    occurrenceByKind: Partial<Record<ShipWeaponKind, number>>,
): ShipWeaponPreset {
    const definition = SHIP_WEAPONS[weaponId];

    const occurrence = occurrenceByKind[definition.kind] ?? 0;

    occurrenceByKind[definition.kind] = occurrence + 1;

    const id = createWeaponRuntimeId(definition.kind, side, occurrence);

    switch (definition.kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
        case SHIP_WEAPON_KIND.BEAM_CANNON:
        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
            return {
                id,
                slotId,
                kind: definition.kind,
                weaponId: definition.id,
            };

        default:
            return assertNever(definition);
    }
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
