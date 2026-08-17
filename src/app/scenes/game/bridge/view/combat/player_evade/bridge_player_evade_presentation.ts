// Player Evade presentation-only tuning.
//
// Engine/content owns warmup, active duration, cooldown and Power cost.
// These values only tune how authoritative WARMUP / EVADING phases look.
export const BRIDGE_PLAYER_EVADE_PRESENTATION = {
    returnFadeMs: 160,

    shake: {
        // Short pulses avoid owning/resetting Phaser's shared camera shake
        // effect for the whole maneuver. Impact shakes may temporarily win.
        pulseIntervalMs: 90,
        pulseDurationMs: 70,

        warmupIntensityX: 0.0005,
        evadeIntensityX: 0.0007,
    },

    dust: {
        color: 0xd7e6ff,

        fadeInMs: 120,
        evadeAlpha: 0.9,

        baseSpeedPxPerSecond: 180,

        speedPulseAmplitude: 0.12,
        speedPulseHz: 1.35,

        alphaPulseAmplitude: 0.08,
        alphaPulseHz: 1.75,

        bands: [
            {
                count: 22,
                speedMultiplier: 0.55,
                minLengthPx: 2,
                maxLengthPx: 4,
                thicknessPx: 1,
                alpha: 0.28,
            },
            {
                count: 16,
                speedMultiplier: 1.1,
                minLengthPx: 5,
                maxLengthPx: 10,
                thicknessPx: 1,
                alpha: 0.48,
            },
            {
                count: 9,
                speedMultiplier: 2,
                minLengthPx: 10,
                maxLengthPx: 20,
                thicknessPx: 2,
                alpha: 0.72,
            },
        ],
    },
} as const;
