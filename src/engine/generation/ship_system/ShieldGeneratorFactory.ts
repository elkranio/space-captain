// src/engine/generation/ship_system/ShieldGeneratorFactory.ts

import { SHIELD_GENERATORS } from "../../content/catalogs/shield_generators";
import {
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
    type ShieldGeneratorState,
} from "../../defs/shield_generator";

export type CreateShieldGeneratorInput = {
    id: string;

    shieldGeneratorId: string;
};

export default class ShieldGeneratorFactory {
    public static create({ id, shieldGeneratorId }: CreateShieldGeneratorInput): ShieldGeneratorState {
        const definition = SHIELD_GENERATORS[shieldGeneratorId];

        if (!definition) {
            throw new Error("Unknown shield generator definition: " + String(shieldGeneratorId));
        }

        return {
            id,

            shieldGeneratorId: definition.id,

            status: SHIELD_GENERATOR_STATUS.ONLINE,

            phase: SHIELD_GENERATOR_PHASE.READY,

            phaseElapsedMs: 0,
        };
    }
}
