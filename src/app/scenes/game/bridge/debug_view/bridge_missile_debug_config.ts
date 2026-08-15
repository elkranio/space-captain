export type BridgeMissileDebugPoint = {
    x: number;
    y: number;
};

export const BRIDGE_MISSILE_DEBUG_CONFIG = {
    textureKey: 'atlas',
    frameKey: 'combat/missiles/generic_test_00',

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

    missile: {
        initialDisplayWidth: 18,
        maxScaleMultiplier: 7.5,

        terminalScaleStartPathProgress: 0.62,

        forwardAngleOffsetDeg: 180,
        terminalYawDeg: 82,
        terminalPitchDeg: -6,

        gridWidth: 8,
        gridHeight: 8,
    },

    trail: {
        color: 0xff6a2c,
        maxPoints: 22,
        minWidth: 1,
        maxWidth: 4,
        maxAlpha: 0.52,
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
