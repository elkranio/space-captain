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

    gizmo: {
        initialScale: 0.72,
        maxScaleMultiplier: 3.4,

        approachStateStartTimeProgress: 0.62,
        terminalStateStartTimeProgress: 0.90,

        bodyColor: 0xd8dde3,
        bodyDarkColor: 0x747b83,
        noseColor: 0xf4f7fa,
        engineColor: 0xd52a24,
        outlineColor: 0x10151b,
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
