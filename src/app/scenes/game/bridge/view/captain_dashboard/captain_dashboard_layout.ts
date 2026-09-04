export const CAPTAIN_DASHBOARD_LAYOUT = {
    shipDashboard: {
        header: {
            sidePadding: 12,
            y: 8,
            height: 36,
            hullX: 8,
            hullPowerCoreGap: 20,
            officerStatusRightPadding: 12,
            officerStatusLetterGap: 8,
        },
        content: {
            x: 16,
            y: 50,
            rightPadding: 16,
            bottomPadding: 18,
        },
        equipmentGrid: {
            columns: 4,
            rows: 3,
            columnGap: 6,
            rowGap: 6,
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
