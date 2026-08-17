// Disposable enemy Evade visual sandbox.
//
// R starts the cycle. R during WARMUP/EVADING simulates interruption.
//
// Visual language:
// - warmup = maneuver thruster at ~1/3 strength, no ship movement;
// - evade = same thruster at full strength + small accumulated X drift;
// - end/interruption = thruster immediately stops, ship keeps its new visual X;
// - next activation always uses the opposite direction.
export const BRIDGE_ENEMY_EVADE_DEBUG_CONFIG = {
    warmupDurationMs: 1000,
    evadeDurationMs: 3000,

    movement: {
        distancePerFullEvadePx: 14,

        // Presentation safety only. Repeated interrupted debug cycles must not
        // walk the target out of the viewscreen forever.
        maxAccumulatedOffsetPx: 36,
    },

    thrusters: {
        warmupStrength: 1 / 3,
        activeStrength: 1,

        activeSpawnPerSecond: 72,

        minSpeedPxPerSecond: 80,
        maxSpeedPxPerSecond: 145,

        minLifeMs: 150,
        maxLifeMs: 300,

        minLengthPx: 2,
        maxLengthPx: 7,

        yJitterPx: 4,

        emitterVerticalOffsetRatio: 0.16,

        colors: [
            0xffffff,
            0xffd37a,
            0xff923d,
        ],
    },
} as const;
