// Disposable enemy Evade visual sandbox.
//
// R starts the cycle. R during WARMUP/EVADING simulates interruption.
export const BRIDGE_ENEMY_EVADE_DEBUG_CONFIG = {
    warmupDurationMs: 1000,
    evadeDurationMs: 3000,
    returnDurationMs: 260,

    movement: {
        maxOffsetPx: 28,
        entryDurationMs: 620,
    },

    thrusters: {
        warmupSpawnPerSecond: 14,
        burstSpawnPerSecond: 95,
        sustainSpawnPerSecond: 30,
        returnSpawnPerSecond: 70,

        activeBurstDurationMs: 720,

        minSpeedPxPerSecond: 85,
        maxSpeedPxPerSecond: 155,

        minLifeMs: 150,
        maxLifeMs: 310,

        minLengthPx: 2,
        maxLengthPx: 7,

        yJitterPx: 5,

        emitterVerticalOffsetRatio: 0.16,

        colors: [
            0xffffff,
            0xffd37a,
            0xff923d,
        ],
    },
} as const;
