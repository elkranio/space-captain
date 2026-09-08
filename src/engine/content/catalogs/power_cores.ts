// src/engine/content/catalogs/power_cores.ts

import powerCoreTuningData from "../data/power_cores.json";
import { POWER_CORE_TUNING_SCHEMA } from "../schemas/power_cores";
import { type PowerCoreDefinition } from "../../defs/power_core";
import { SHIP_SLOT_KIND } from "../../defs/ship_slot";

const POWER_CORE_TUNING = POWER_CORE_TUNING_SCHEMA.parse(powerCoreTuningData);

export const POWER_CORES = Object.fromEntries(
    Object.entries(POWER_CORE_TUNING).map(([id, tuning]) => {
        return [
            id,
            {
                id,
                slotKind: SHIP_SLOT_KIND.POWER_CORE,
                ...tuning,
            },
        ];
    }),
) as Record<string, PowerCoreDefinition>;
