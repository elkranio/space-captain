// src/engine/encounter/combat/power_core/resolve_mounted_power_core.ts

import type { PowerCoreState } from "../../../defs/power_core";
import type { ShipEquipmentMountState } from "../../../defs/ship_slot";

// Compatibility resolver for the migration from the old special Core field.
// Real ship/loadout paths provide mounts; an installed Core must be present there.
// Empty mounts temporarily preserve old minimal test/dev callers until compatibility cleanup.
export function resolveMountedPowerCore(
    mounts: readonly ShipEquipmentMountState[],
    powerCore: PowerCoreState | undefined,
): PowerCoreState | undefined {
    if (!powerCore) {
        return undefined;
    }

    if (mounts.length === 0) {
        return powerCore;
    }

    return mounts.some((mount) => mount.equipmentId === powerCore.id) ? powerCore : undefined;
}
