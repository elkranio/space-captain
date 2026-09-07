export const CAPTAIN_DASHBOARD_LAYOUT = {
    shipDashboard: {
        width: 640,
        height: 335,
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
        dividerY: 58,
        dividerHeight: 1,
        statusY: 64,
        iconCenterOffsetY: -10,
        iconMaxWidth: 76,
        iconMaxHeight: 42,
        integrityOffsetY: 3,
        hoverTextGap: 6,
        hoverHeaderHeight: 22,
    },
} as const;
