// src/engine/content/catalogs/shield_generators.ts

import shieldGeneratorTuningData from "../data/shield_generators.json";
import { SHIELD_GENERATOR_TUNING_SCHEMA } from "../schemas/shield_generators";
import { type ShieldGeneratorDefinition } from "../../defs/shield_generator";
import { SHIP_SLOT_KIND } from "../../defs/ship_slot";

const SHIELD_GENERATOR_TUNING = SHIELD_GENERATOR_TUNING_SCHEMA.parse(shieldGeneratorTuningData);

export const SHIELD_GENERATORS = Object.fromEntries(
    Object.entries(SHIELD_GENERATOR_TUNING).map(([id, tuning]) => {
        return [
            id,
            {
                id,
                slotKind: SHIP_SLOT_KIND.DEFENSE,
                ...tuning,
            },
        ];
    }),
) as Record<string, ShieldGeneratorDefinition>;
