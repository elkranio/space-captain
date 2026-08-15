export type BridgeMissileDebugPoint = {
    x: number;
    y: number;
};

export const BRIDGE_MISSILE_DEBUG_CONFIG = {
    durationMs: 12_000,

    start: {
        x: 790,
        y: 160,
    },

    trajectories: {
        // 1: upper-left exit.
        '1': {
            control1: {
                x: 720,
                y: 130,
            },

            control2: {
                x: 460,
                y: 105,
            },

            end: {
                x: 205,
                y: 70,
            },
        },

        // 2: lower-left exit.
        '2': {
            control1: {
                x: 715,
                y: 145,
            },

            control2: {
                x: 430,
                y: 225,
            },

            end: {
                x: 190,
                y: 350,
            },
        },

        // 3: current baseline trajectory, unchanged.
        '3': {
            control1: {
                x: 720,
                y: 135,
            },

            control2: {
                x: 520,
                y: 155,
            },

            end: {
                x: 515,
                y: 455,
            },
        },

        // 4: lower-right hook.
        '4': {
            control1: {
                x: 715,
                y: 135,
            },

            control2: {
                x: 900,
                y: 280,
            },

            end: {
                x: 1090,
                y: 365,
            },
        },

        // 5: upper-right hook.
        '5': {
            control1: {
                x: 715,
                y: 125,
            },

            control2: {
                x: 930,
                y: 105,
            },

            end: {
                x: 1085,
                y: 70,
            },
        },
    },

    motion: {
        terminalStartTimeProgress: 0.90,
        terminalStartPathProgress: 0.62,

        // Keeps non-zero velocity from the first frame and
        // accelerates continuously through the cruise phase.
        cruiseLinearWeight: 0.35,

        // Chosen to keep velocity continuous at the transition,
        // then the cubic term produces the hard terminal rush.
        terminalLinearWeight: 0.30,
    },

    missile: {
        color: 0xf7fbff,

        minPixelSize: 2,
        maxPixelSize: 10,
    },

    trail: {
        hotColor: 0xffd36a,
        coolColor: 0xff5b33,

        minParticleCount: 5,
        maxParticleCount: 34,

        minParticleSpacingPx: 2,

        minParticleSize: 1,
        maxParticleSize: 5,

        minAlpha: 0.32,
        maxAlpha: 0.78,
    },

    impact: {
        flashColor: 0xffd88a,
        flashRadius: 12,
        flashScale: 5,
        flashDurationMs: 140,

        shakeDurationMs: 110,
        shakeIntensity: 0.004,
    },
} as const;
