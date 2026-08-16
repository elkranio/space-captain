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
        // 1: launch left, long upper cruise, then exit upper-left.
        '1': {
            points: [
                { x: 720, y: 145 },
                { x: 640, y: 130 },
                { x: 550, y: 120 },
                { x: 450, y: 118 },
                { x: 340, y: 105 },
            ],

            end: {
                x: 205,
                y: 70,
            },
        },

        // 2: broad left sweep, then dive toward lower-left.
        '2': {
            points: [
                { x: 720, y: 158 },
                { x: 640, y: 175 },
                { x: 550, y: 205 },
                { x: 455, y: 245 },
                { x: 355, y: 290 },
                { x: 265, y: 330 },
            ],

            end: {
                x: 190,
                y: 350,
            },
        },

        // 3: baseline downward approach, now shaped by explicit waypoints.
        '3': {
            points: [
                { x: 720, y: 153 },
                { x: 650, y: 175 },
                { x: 590, y: 225 },
                { x: 550, y: 300 },
                { x: 525, y: 380 },
            ],

            end: {
                x: 515,
                y: 455,
            },
        },

        // 4: detach left/down, hook under the ship, then sweep lower-right.
        '4': {
            points: [
                { x: 720, y: 150 },
                { x: 690, y: 205 },
                { x: 745, y: 245 },
                { x: 830, y: 270 },
                { x: 925, y: 300 },
                { x: 1015, y: 335 },
            ],

            end: {
                x: 1090,
                y: 365,
            },
        },

        // 5: detach left/down, hook under the ship, then climb upper-right.
        '5': {
            points: [
                { x: 720, y: 150 },
                { x: 690, y: 205 },
                { x: 750, y: 235 },
                { x: 835, y: 215 },
                { x: 920, y: 175 },
                { x: 1005, y: 120 },
            ],

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
        coreColor: 0xf7fbff,
        hotColor: 0xffcf63,
        hotAlpha: 0.58,
        hotPaddingPx: 2,

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
