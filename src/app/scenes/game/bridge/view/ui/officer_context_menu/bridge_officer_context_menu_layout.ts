// src/app/scenes/game/bridge/view/ui/officer_context_menu/bridge_officer_context_menu_layout.ts

import { OFFICER_ROLE, type OfficerRole } from "../../../../../../../engine/defs/officer";
import { BRIDGE_OFFICER_STATION_LAYOUT } from "../../officer_stations/bridge_officer_station_layout";

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
    [OFFICER_ROLE.SCIENCE]: BRIDGE_OFFICER_STATION_LAYOUT[OFFICER_ROLE.SCIENCE].contextMenuPosition,

    [OFFICER_ROLE.HELM]: BRIDGE_OFFICER_STATION_LAYOUT[OFFICER_ROLE.HELM].contextMenuPosition,

    [OFFICER_ROLE.WEAPONS]: BRIDGE_OFFICER_STATION_LAYOUT[OFFICER_ROLE.WEAPONS].contextMenuPosition,

    [OFFICER_ROLE.ENGINEER]: BRIDGE_OFFICER_STATION_LAYOUT[OFFICER_ROLE.ENGINEER].contextMenuPosition,
} satisfies Record<OfficerRole, OfficerContextMenuPosition>;
