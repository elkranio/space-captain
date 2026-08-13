// src/engine/encounter/combat/defense_turret/resolve_missile_interception.ts

import {
    DEFENSE_TURRET_SHOT_OUTCOME,
    type DefenseTurretShotOutcome,
} from '../../../defs/defense_turret';
import type {
    MissileSignature,
} from '../../../defs/missile';

export function resolveMissileInterception({
    truth,
    hypothesis,
    blindInterceptChance,
    random,
}: {
    truth: MissileSignature;
    hypothesis?: MissileSignature;

    blindInterceptChance: number;
    random: () => number;
}): DefenseTurretShotOutcome {
    if (
        !Number.isFinite(blindInterceptChance) ||
        blindInterceptChance < 0 ||
        blindInterceptChance > 1
    ) {
        throw new Error(
            'Defense turret blind intercept chance must be in [0, 1]: ' +
                blindInterceptChance,
        );
    }

    // A correct concrete Science hypothesis gives the system
    // enough information for a guaranteed physical intercept.
    // CONFIRMED vs UNCERTAIN is irrelevant here: correctness is truth.
    if (hypothesis === truth) {
        return DEFENSE_TURRET_SHOT_OUTCOME.HIT;
    }

    const randomValue =
        random();

    if (
        !Number.isFinite(randomValue) ||
        randomValue < 0 ||
        randomValue >= 1
    ) {
        throw new Error(
            'Defense turret random source must return a value in [0, 1): ' +
                randomValue,
        );
    }

    return randomValue < blindInterceptChance
        ? DEFENSE_TURRET_SHOT_OUTCOME.HIT
        : DEFENSE_TURRET_SHOT_OUTCOME.MISS;
}
