export type BridgeIncomingMissilePoint = {
    x: number;
    y: number;
};

export const BRIDGE_INCOMING_MISSILE_PRESENTATION = {
    trajectories: [
        {
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

        {
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

        {
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

        {
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

        {
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
    ],

    jitter: {
        firstWaypointPx: 4,
        waypointPx: 10,
        endPx: 5,
    },

    motion: {
        terminalStartTimeProgress: 0.90,
        terminalStartPathProgress: 0.62,

        cruiseLinearWeight: 0.42,
        terminalLinearWeight: 0.392,
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
} as const;
