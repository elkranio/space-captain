export const CAPTAIN_DASHBOARD_LAYOUT = {
    shipDashboard: {
        header: {
            sidePadding: 12,
            y: 8,
            height: 36,
        },
        content: {
            x: 16,
            y: 50,
            rightPadding: 16,
            bottomPadding: 18,
        },
    },

    equipmentTile: {
        horizontalPadding: 9,
        titleY: 3,
        statusY: 70,
        iconCenterOffsetY: 1,
        integrityOffsetY: 2,
        hoverTextGap: 6,
        hoverHeaderHeight: 22,
    },
} as const;
