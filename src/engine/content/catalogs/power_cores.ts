// src/engine/content/catalogs/power_cores.ts

import powerCoreTuningData from "../data/power_cores.json";
import { POWER_CORE_TUNING_SCHEMA } from "../schemas/power_cores";
import { type PowerCoreDefinition, type PowerCoreId } from "../../defs/power_core";

const POWER_CORE_TUNING = POWER_CORE_TUNING_SCHEMA.parse(powerCoreTuningData);

export const POWER_CORES = Object.fromEntries(
    Object.entries(POWER_CORE_TUNING).map(([id, tuning]) => {
        return [
            id,
            {
                id,
                ...tuning,
            },
        ];
    }),
) as Record<PowerCoreId, PowerCoreDefinition>;
