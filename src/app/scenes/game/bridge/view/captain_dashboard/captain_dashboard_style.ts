// Shared visual tokens for the captain dashboard.
//
// This is intentionally not a geometry/layout system.
// Coordinates and sizes stay beside each concrete view while they are
// still evolving. Only repeated visual semantics live here.
export const CAPTAIN_DASHBOARD_STYLE = {
    targetSelection: {
        blockedTileAlpha: 0.4,
        pulseMinAlpha: 0.3,
        pulseDurationMs: 900,
    },
    header: {
        dividerColor: 0x31465b,
    },

    powerCore: {
        chargeColor: 0x69bff2,
        rechargeColor: 0xa2dcff,
        emptyAlpha: 0.24,
    },

    equipmentSlot: {
        backgroundColor: 0x0b1621,
        backgroundAlpha: 0.72,

        borderColor: 0x315f7a,
        borderAlpha: 0.62,
        emptyBorderAlpha: 0.24,
        borderThickness: 1,
        cornerCut: 6,

        highlightBorderColor: 0xd7e6ff,
        highlightBorderAlpha: 1,
        highlightBorderThickness: 2,
        highlightInset: 1,
        hoverHeaderAlpha: 0.14,
    },

    equipmentProgress: {
        readyColor: 0xffffff,
        cooldownColor: 0x315f7a,
        repairColor: 0xff4d4d,
        activityColor: 0xea9e3e,
    },

    equipmentAccent: {
        iconColor: 0x69bff2,
    },

    equipmentIntegrity: {
        filledColor: 0x71c651,
        emptyAlpha: 0.24,
    },

    hull: {
        filledColor: 0x71c651,
        emptyAlpha: 0.24,
    },

} as const;
