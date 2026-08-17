// Temporary visual-only Evade sandbox tuning.
//
// Nothing here belongs to engine truth. The goal is to find a readable
// first-person motion language before wiring presentation to ShipEvadeState.
export const BRIDGE_EVADE_DEBUG_CONFIG = {
    warmupDurationMs: 1000,
    evadeDurationMs: 3000,
    returnDurationMs: 160,

    // Very small physical camera/world jink.
    // Dust is responsible for selling most of the apparent speed.
    warmupOffsetX: -2,

    evadeKeyframes: [
        {
            progress: 0,
            offsetX: -2,
        },
        {
            progress: 0.18,
            offsetX: 7,
        },
        {
            progress: 0.42,
            offsetX: -8,
        },
        {
            progress: 0.68,
            offsetX: 7,
        },
        {
            progress: 0.88,
            offsetX: -5,
        },
        {
            progress: 1,
            offsetX: 3,
        },
    ],

    dust: {
        color: 0xd7e6ff,

        // Converts tiny world-jink deltas into much stronger apparent
        // near-camera motion.
        motionGain: 4.5,

        warmupAlpha: 0.35,
        evadeAlpha: 0.9,

        bands: [
            {
                count: 22,
                speedMultiplier: 0.75,
                minLengthPx: 2,
                maxLengthPx: 5,
                thicknessPx: 1,
                alpha: 0.28,
            },
            {
                count: 16,
                speedMultiplier: 1.45,
                minLengthPx: 4,
                maxLengthPx: 9,
                thicknessPx: 1,
                alpha: 0.48,
            },
            {
                count: 9,
                speedMultiplier: 2.4,
                minLengthPx: 8,
                maxLengthPx: 18,
                thicknessPx: 2,
                alpha: 0.72,
            },
        ],
    },
} as const;
