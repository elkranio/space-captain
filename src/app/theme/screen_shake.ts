export type ScreenShakePreset = {
    durationMs: number;
    intensity: number;
};

export const SCREEN_SHAKE = {
    LIGHT: {
        durationMs: 80,
        intensity: 0.002,
    },

    MEDIUM: {
        durationMs: 120,
        intensity: 0.004,
    },

    HEAVY: {
        durationMs: 220,
        intensity: 0.008,
    },
} as const satisfies Record<"LIGHT" | "MEDIUM" | "HEAVY", ScreenShakePreset>;
