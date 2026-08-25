// src/engine/content/catalogs/debug_start.ts

import debugStartData from "../data/debug_start.json";
import {
    DEBUG_START_EQUIPMENT_TYPE,
    DEBUG_START_SCHEMA,
    type DebugStartData,
} from "../schemas/debug_start";
import { DEFENSE_TURRETS } from "./defense_turrets";
import { POWER_CORES } from "./power_cores";
import { SHIELD_GENERATORS } from "./shield_generators";
import { SHIP_CHASSIS } from "./ship_chassis";
import { SHIP_DRIVES } from "./ship_drives";
import { SHIP_WEAPONS } from "./ship_weapons";

const parsed = DEBUG_START_SCHEMA.parse(debugStartData);

function assertReference(field: string, id: string, catalog: object): void {
    if (Object.prototype.hasOwnProperty.call(catalog, id)) {
        return;
    }

    throw new Error("Unknown Debug Start content reference: " + field + "=" + id);
}

function assertOptionalReference(field: string, id: string | null, catalog: object): void {
    if (id === null) {
        return;
    }

    assertReference(field, id, catalog);
}

function assertEquipmentReferences(
    side: "player" | "enemy",
    equipment: DebugStartData["player"]["equipment"],
): void {
    for (const [index, item] of equipment.entries()) {
        const field = side + ".equipment[" + String(index) + "].equipmentId";

        switch (item.type) {
            case DEBUG_START_EQUIPMENT_TYPE.DRIVE:
                assertReference(field, item.equipmentId, SHIP_DRIVES);
                break;

            case DEBUG_START_EQUIPMENT_TYPE.DEFENSE_TURRET:
                assertReference(field, item.equipmentId, DEFENSE_TURRETS);
                break;

            case DEBUG_START_EQUIPMENT_TYPE.SHIELD_GENERATOR:
                assertReference(field, item.equipmentId, SHIELD_GENERATORS);
                break;

            case DEBUG_START_EQUIPMENT_TYPE.WEAPON:
                assertReference(field, item.equipmentId, SHIP_WEAPONS);
                break;
        }
    }
}

assertReference("player.chassisId", parsed.player.chassisId, SHIP_CHASSIS);
assertReference("player.powerCoreId", parsed.player.powerCoreId, POWER_CORES);
assertEquipmentReferences("player", parsed.player.equipment);

assertReference("enemy.chassisId", parsed.enemy.chassisId, SHIP_CHASSIS);
assertOptionalReference("enemy.powerCoreId", parsed.enemy.powerCoreId, POWER_CORES);
assertEquipmentReferences("enemy", parsed.enemy.equipment);

// Canonical validated debug/sandbox start configuration.
// This is content, not mutable runtime state.
export const DEBUG_START = parsed;
