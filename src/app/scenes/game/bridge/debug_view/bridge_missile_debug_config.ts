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

    curve: {
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
        coolColor: 0xd34a27,

        minParticleCount: 3,
        maxParticleCount: 34,

        minParticleSize: 1,
        maxParticleSize: 5,

        minAlpha: 0.10,
        maxAlpha: 0.78,
    },

    impact: {
        flashX: 515,
        flashY: 350,
        flashColor: 0xffd88a,
        flashRadius: 12,
        flashScale: 5,
        flashDurationMs: 140,

        shakeDurationMs: 110,
        shakeIntensity: 0.004,
    },
} as const;
