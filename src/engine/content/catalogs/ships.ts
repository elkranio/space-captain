// src/engine/content/catalogs/ships.ts

import shipsData from "../data/ships.json";
import {
    SHIP_EQUIPMENT_TYPE,
    SHIPS_SCHEMA,
    type ShipData,
} from "../schemas/ships";
import type { ShipPreset, ShipWeaponPreset } from "../presets/ships";
import { DEFENSE_TURRETS } from "./defense_turrets";
import { POWER_CORES } from "./power_cores";
import { SHIELD_GENERATORS } from "./shield_generators";
import { SHIP_CHASSIS } from "./ship_chassis";
import { SHIP_DRIVES } from "./ship_drives";
import { SHIP_WEAPONS } from "./ship_weapons";
import type { ShipSlotKind } from "../../defs/ship_slot";

export type ShipDefinition = ShipPreset & {
    name: string;
};

const parsed = SHIPS_SCHEMA.parse(shipsData);
const ships: Record<string, ShipDefinition> = {};

for (const [id, data] of Object.entries(parsed)) {
    ships[id] = createShipDefinition(id, data);
}

export const SHIPS = ships;

function createShipDefinition(id: string, data: ShipData): ShipDefinition {
    const chassis = SHIP_CHASSIS[data.chassisId];

    if (!chassis) {
        throw new Error("Ship definition references missing chassis: " + id + "/" + data.chassisId);
    }

    let drive: ShipPreset["drive"] | undefined;
    let powerCore: ShipPreset["powerCore"];
    let defenseTurret: ShipPreset["defenseTurret"];
    let shieldGenerator: ShipPreset["shieldGenerator"];
    const weapons: ShipWeaponPreset[] = [];

    for (const equipment of data.equipment) {
        switch (equipment.type) {
            case SHIP_EQUIPMENT_TYPE.DRIVE: {
                const definition = SHIP_DRIVES[equipment.equipmentId];

                if (!definition) {
                    throw new Error(
                        "Ship definition references missing drive: " + id + "/" + equipment.equipmentId,
                    );
                }

                assertSlotKind(id, equipment.id, equipment.slotId, definition.slotKind, data.chassisId);

                drive = {
                    id: equipment.id,
                    slotId: equipment.slotId,
                    driveId: definition.id,
                };
                break;
            }

            case SHIP_EQUIPMENT_TYPE.POWER_CORE: {
                const definition = POWER_CORES[equipment.equipmentId];

                if (!definition) {
                    throw new Error(
                        "Ship definition references missing Power Core: " + id + "/" + equipment.equipmentId,
                    );
                }

                assertSlotKind(id, equipment.id, equipment.slotId, definition.slotKind, data.chassisId);

                powerCore = {
                    id: equipment.id,
                    slotId: equipment.slotId,
                    powerCoreId: definition.id,
                };
                break;
            }

            case SHIP_EQUIPMENT_TYPE.DEFENSE_TURRET: {
                const definition = DEFENSE_TURRETS[equipment.equipmentId];

                if (!definition) {
                    throw new Error(
                        "Ship definition references missing Defense Turret: " + id + "/" + equipment.equipmentId,
                    );
                }

                assertSlotKind(id, equipment.id, equipment.slotId, definition.slotKind, data.chassisId);

                defenseTurret = {
                    id: equipment.id,
                    slotId: equipment.slotId,
                    defenseTurretId: definition.id,
                };
                break;
            }

            case SHIP_EQUIPMENT_TYPE.SHIELD_GENERATOR: {
                const definition = SHIELD_GENERATORS[equipment.equipmentId];

                if (!definition) {
                    throw new Error(
                        "Ship definition references missing Shield Generator: " + id + "/" + equipment.equipmentId,
                    );
                }

                assertSlotKind(id, equipment.id, equipment.slotId, definition.slotKind, data.chassisId);

                shieldGenerator = {
                    id: equipment.id,
                    slotId: equipment.slotId,
                    shieldGeneratorId: definition.id,
                };
                break;
            }

            case SHIP_EQUIPMENT_TYPE.WEAPON: {
                const definition = SHIP_WEAPONS[equipment.equipmentId];

                if (!definition) {
                    throw new Error(
                        "Ship definition references missing weapon: " + id + "/" + equipment.equipmentId,
                    );
                }

                assertSlotKind(id, equipment.id, equipment.slotId, definition.slotKind, data.chassisId);

                weapons.push({
                    id: equipment.id,
                    slotId: equipment.slotId,
                    kind: definition.kind,
                    weaponId: definition.id,
                });
                break;
            }
        }
    }

    if (!drive) {
        throw new Error("Ship definition is missing Drive equipment: " + id);
    }

    return {
        id,
        name: data.name,
        chassisId: data.chassisId,
        drive,
        ...(defenseTurret ? { defenseTurret } : {}),
        ...(powerCore ? { powerCore } : {}),
        ...(shieldGenerator ? { shieldGenerator } : {}),
        weapons,
    };
}

function assertSlotKind(
    shipId: string,
    equipmentId: string,
    slotId: string,
    equipmentSlotKind: ShipSlotKind,
    chassisId: string,
): void {
    const chassis = SHIP_CHASSIS[chassisId];
    const slot = chassis.slots.find((candidate) => {
        return candidate.id === slotId;
    });

    if (!slot) {
        throw new Error(
            "Ship definition equipment references missing chassis slot: " + shipId + "/" + equipmentId + "/" + slotId,
        );
    }

    if (slot.kind !== equipmentSlotKind) {
        throw new Error(
            "Ship definition equipment slot kind mismatch: " +
                shipId +
                "/" +
                equipmentId +
                "/" +
                equipmentSlotKind +
                " -> " +
                slot.id +
                "/" +
                slot.kind,
        );
    }
}
