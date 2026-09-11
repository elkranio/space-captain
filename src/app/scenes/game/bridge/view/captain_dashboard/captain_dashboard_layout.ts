// src/app/scenes/game/bridge/view/captain_dashboard/captain_dashboard_layout.ts
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

    semanticTile: {
        iconCenterOffsetX: 0,
        iconCenterOffsetY: 0,
    },

    equipmentTile: {
        horizontalPadding: 9,
        titleY: 3,
        dividerY: 58,
        dividerHeight: 1,
        statusLeftX: 5,
        statusY: 60,
        iconCenterOffsetY: -7,
        integrityRightPadding: 14,
        integrityOffsetY: 3,
        hoverInset: 5,
        hoverTextGap: 6,
    },
} as const;
