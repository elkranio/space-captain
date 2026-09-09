// src/engine/encounter/combat/power_core/resolve_mounted_power_core.ts

import type { PowerCoreState } from "../../../defs/power_core";
import type { ShipEquipmentMountState } from "../../../defs/ship_slot";

// An installed Core participates in encounter state only when its runtime id is physically mounted.
export function resolveMountedPowerCore(
    mounts: readonly ShipEquipmentMountState[],
    powerCore: PowerCoreState | undefined,
): PowerCoreState | undefined {
    if (!powerCore) {
        return undefined;
    }

    return mounts.some((mount) => mount.equipmentId === powerCore.id) ? powerCore : undefined;
}
