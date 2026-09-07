import {
    SHIP_CHASSIS_SURFACE_HEIGHT,
    SHIP_CHASSIS_SURFACE_WIDTH,
} from "../../../../../../engine/defs/ship_chassis";
import type { ShipSlotDefinition } from "../../../../../../engine/defs/ship_slot";
import type { BridgeEquipmentSlotPayload } from "../../events/bridge_event";

const LEGACY_GRID_COLUMNS = 4;
const LEGACY_GRID_ROWS = 3;

// Временный адаптер до удаления старого 4x3 renderer.
// Chassis x/y остаются единственным источником истины для геометрии.
export function mapChassisSlotToLegacyGrid(slot: ShipSlotDefinition): BridgeEquipmentSlotPayload {
    return {
        column: Math.max(
            1,
            Math.min(
                LEGACY_GRID_COLUMNS,
                Math.floor(
                    (slot.x + SHIP_CHASSIS_SURFACE_WIDTH / 2) /
                        (SHIP_CHASSIS_SURFACE_WIDTH / LEGACY_GRID_COLUMNS),
                ) + 1,
            ),
        ),
        row: Math.max(
            1,
            Math.min(
                LEGACY_GRID_ROWS,
                Math.floor(
                    (slot.y + SHIP_CHASSIS_SURFACE_HEIGHT / 2) /
                        (SHIP_CHASSIS_SURFACE_HEIGHT / LEGACY_GRID_ROWS),
                ) + 1,
            ),
        ),
    };
}
