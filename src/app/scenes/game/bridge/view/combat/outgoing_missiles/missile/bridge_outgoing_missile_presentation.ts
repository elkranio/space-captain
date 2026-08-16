export type BridgeOutgoingMissilePoint = {
    x: number;
    y: number;
};

export type BridgeOutgoingMissileTrailPoint =
    BridgeOutgoingMissilePoint & {
        pathProgress: number;
    };

export type BridgeOutgoingMissileWaypoint = {
    progress: number;
    offsetX: number;
    offsetY: number;
};

export const BRIDGE_OUTGOING_MISSILE_PRESENTATION = {
    // Waypoints are authored relative to the straight
    // start -> target line. This keeps the five visual
    // trajectory characters usable when enemy position changes.
    trajectories: [
        // Wide left sweep.
        {
            waypoints: [
                {
                    progress: 0.20,
                    offsetX: -240,
                    offsetY: -15,
                },
                {
                    progress: 0.45,
                    offsetX: -280,
                    offsetY: -60,
                },
                {
                    progress: 0.70,
                    offsetX: -170,
                    offsetY: -45,
                },
                {
                    progress: 0.86,
                    offsetX: -80,
                    offsetY: -15,
                },
            ],
        },

        // Shallower left approach.
        {
            waypoints: [
                {
                    progress: 0.22,
                    offsetX: -90,
                    offsetY: -15,
                },
                {
                    progress: 0.48,
                    offsetX: -125,
                    offsetY: -45,
                },
                {
                    progress: 0.72,
                    offsetX: -85,
                    offsetY: -30,
                },
                {
                    progress: 0.88,
                    offsetX: -35,
                    offsetY: -10,
                },
            ],
        },

        // Direct S-shaped approach.
        {
            waypoints: [
                {
                    progress: 0.24,
                    offsetX: -35,
                    offsetY: 10,
                },
                {
                    progress: 0.48,
                    offsetX: 45,
                    offsetY: -25,
                },
                {
                    progress: 0.72,
                    offsetX: -30,
                    offsetY: -20,
                },
                {
                    progress: 0.88,
                    offsetX: 15,
                    offsetY: -5,
                },
            ],
        },

        // Low-right sweep.
        {
            waypoints: [
                {
                    progress: 0.18,
                    offsetX: 150,
                    offsetY: 40,
                },
                {
                    progress: 0.40,
                    offsetX: 240,
                    offsetY: 20,
                },
                {
                    progress: 0.65,
                    offsetX: 180,
                    offsetY: -20,
                },
                {
                    progress: 0.84,
                    offsetX: 80,
                    offsetY: -15,
                },
            ],
        },

        // High-right hook.
        {
            waypoints: [
                {
                    progress: 0.18,
                    offsetX: 100,
                    offsetY: -30,
                },
                {
                    progress: 0.40,
                    offsetX: 250,
                    offsetY: -100,
                },
                {
                    progress: 0.65,
                    offsetX: 250,
                    offsetY: -120,
                },
                {
                    progress: 0.82,
                    offsetX: 140,
                    offsetY: -70,
                },
                {
                    progress: 0.93,
                    offsetX: 50,
                    offsetY: -20,
                },
            ],
        },
    ],

    jitter: {
        waypointPx: 6,
    },

    missile: {
        coreColor: 0xf7fbff,
        hotColor: 0xffcf63,
        hotAlpha: 0.58,
        hotPaddingPx: 2,

        startPixelSize: 10,
        targetPixelSize: 2,
    },

    trail: {
        hotColor: 0xffd36a,
        coolColor: 0xff5b33,

        startParticleCount: 32,
        targetParticleCount: 5,

        minParticleSpacingPx: 2,

        startParticleSize: 5,
        targetParticleSize: 1,

        startAlpha: 0.78,
        targetAlpha: 0.30,
    },
} as const;
