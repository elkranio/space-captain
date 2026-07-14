// src/app/scenes/game/bridge/view/ui/officer_context_menu/bridge_officer_context_menu_layout.ts

import { OFFICER_ROLE, type OfficerRole } from '../../../../../../../engine/defs/officer';

export type OfficerContextMenuPosition = {
    x: number;
    y: number;
};

export const OFFICER_CONTEXT_MENU_LAYOUT = {
    width: 376,

    header: {
        labelCenterX: 178,
        labelCenterY: 21,
    },

    content: {
        x: 24,
        y: 56,
        bottomPadding: 24,
    },

    groupLabel: {
        x: 32,
        height: 20,
        marginTop: 10,
        marginBottom: 2,
    },

    item: {
        x: 24,
        width: 328,
        height: 27,
        gap: -2,

        labelX: 12,
        labelY: 8,
    },
} as const;

export const OFFICER_CONTEXT_MENU_POSITION_BY_ROLE = {
    [OFFICER_ROLE.COMMS]: {
        x: 220,
        y: 78,
    },

    [OFFICER_ROLE.SCIENCE]: {
        x: 220,
        y: 250,
    },

    [OFFICER_ROLE.HELM]: {
        x: 220,
        y: 392,
    },

    [OFFICER_ROLE.WEAPONS]: {
        x: 684,
        y: 78,
    },

    [OFFICER_ROLE.ENGINEER]: {
        x: 684,
        y: 250,
    },
} satisfies Record<OfficerRole, OfficerContextMenuPosition>;
