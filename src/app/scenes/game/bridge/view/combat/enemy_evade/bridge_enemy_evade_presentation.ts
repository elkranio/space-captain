// Accepted enemy Evade render language.
//
// Timing is intentionally absent. Engine/read-model owns WARMUP / EVADING and
// supplies active duration to presentation.
export const BRIDGE_ENEMY_EVADE_PRESENTATION = {
    movement: {
        distancePerFullEvadePx: 14,

        // Presentation safety only. Repeated maneuvers must not walk the target
        // out of the viewscreen forever.
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
