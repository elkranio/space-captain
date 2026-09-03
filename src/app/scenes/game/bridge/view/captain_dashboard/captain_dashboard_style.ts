// Shared visual tokens for the captain dashboard.
//
// This is intentionally not a geometry/layout system.
// Coordinates and sizes stay beside each concrete view while they are
// still evolving. Only repeated visual semantics live here.
export const CAPTAIN_DASHBOARD_STYLE = {
    header: {
        dividerColor: 0x31465b,
    },

    powerCore: {
        emptyBackgroundColor: 0x07121e,
        emptyBorderColor: 0x315f7a,
        chargeColor: 0x69bff2,
        rechargeColor: 0xa2dcff,
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
    },

    equipmentProgress: {
        readyColor: 0xffffff,
        cooldownColor: 0x315f7a,
        repairColor: 0xff4d4d,
        activityColor: 0xea9e3e,
    },

    equipmentIntegrity: {
        filledColor: 0x69bff2,
        emptyColor: 0x07121e,
        borderColor: 0x69bff2,
    },

    hull: {
        filledColor: 0x71c651,
        borderColor: 0x71c651,
    },

    specialColumn: {
        panelBackgroundColor: 0x0b1621,
        panelBackgroundAlpha: 0.9,
        panelBorderColor: 0x31465b,
        panelBorderThickness: 1,

        cellBackgroundColor: 0x101923,
        cellBorderColor: 0x31465b,

        hullTrackColor: 0x1b2733,
        hullFillColor: 0x71c651,
    },

} as const;
