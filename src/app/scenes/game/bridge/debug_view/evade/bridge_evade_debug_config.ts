// src/app/scenes/game/bridge/debug_view/evade/bridge_evade_debug_config.ts
// Temporary visual-only Evade sandbox tuning.
//
// Nothing here belongs to engine truth. The goal is to find a readable
// first-person motion language before wiring presentation to ShipEvadeState.
export const BRIDGE_EVADE_DEBUG_CONFIG = {
    warmupDurationMs: 1000,
    evadeDurationMs: 3000,
    returnDurationMs: 160,

    // Tiny horizontal-only camera vibration.
    // Phaser shake intensity is normalized against camera dimensions.
    shake: {
        warmupIntensityX: 0.0005,
        evadeIntensityX: 0.0007,
    },

    dust: {
        color: 0xd7e6ff,

        fadeInMs: 120,
        evadeAlpha: 0.9,

        // Constant lateral flow sells the maneuver while the actual world
        // remains nominal. Direction is chosen once per activation.
        baseSpeedPxPerSecond: 180,

        // Small modulation keeps a three-second activation from looking like
        // a conveyor belt / low-speed warp effect.
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
