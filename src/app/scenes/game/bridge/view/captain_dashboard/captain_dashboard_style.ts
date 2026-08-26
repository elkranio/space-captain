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
        backgroundAlpha: 0.86,

        borderColor: 0x31465b,
        borderThickness: 1,
    },

    equipmentProgress: {
        readyColor: 0x69bff2,
        cooldownColor: 0x315f7a,
        repairColor: 0xff4d4d,
        activityColor: 0xea9e3e,
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

    row: {
        backgroundColor: 0x0e1620,
        backgroundAlpha: 0.94,

        borderColor: 0x26394c,
        borderThickness: 1,

        iconBackgroundColor: 0x152332,
        iconBorderColor: 0x45627f,
    },

    action: {
        activeBackgroundColor: 0x193147,
        activeBorderColor: 0x7aa0c4,

        disabledBackgroundColor: 0x101923,
        disabledBorderColor: 0x26394c,
        disabledTextColor: 0x536778,
    },

    statusCell: {
        backgroundColor: 0x101923,
        backgroundAlpha: 0.96,

        borderColor: 0x31465b,
        borderThickness: 1,
    },

    defenseRechargeBar: {
        trackColor: 0x26384a,
        fillColor: 0xb69a45,
    },
} as const;
