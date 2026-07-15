// src/app/scenes/game/bridge/view/barks/bridge_officer_bark_layout.ts

import { OFFICER_ROLE, type OfficerRole } from '../../../../../../engine/defs/officer';

export const OFFICER_BARK_SIDE = {
    LEFT: 'left',
    RIGHT: 'right',
} as const;

export type OfficerBarkSide = (typeof OFFICER_BARK_SIDE)[keyof typeof OFFICER_BARK_SIDE];

export type OfficerBarkPosition = {
    x: number;
    y: number;
    side: OfficerBarkSide;
};

export const BRIDGE_OFFICER_BARK_LAYOUT = {
    tile: {
        cornerSize: 16,
        horizontalSize: 8,
        verticalSize: 8,
        centerSize: 8,
    },

    bubble: {
        minWidth: 140,
        minHeight: 40,
        maxTextWidth: 300,
        paddingX: 22,
        paddingY: 14,
        tileStep: 8,
    },

    text: {
        x: 22,
        y: 16,
    },

    tail: {
        x: 36,
        yFromBottom: 8,
    },
} as const;

export const OFFICER_BARK_POSITION_BY_ROLE = {
    [OFFICER_ROLE.COMMS]: {
        x: 130,
        y: 60,
        side: OFFICER_BARK_SIDE.LEFT,
    },

    [OFFICER_ROLE.SCIENCE]: {
        x: 130,
        y: 275,
        side: OFFICER_BARK_SIDE.LEFT,
    },

    [OFFICER_ROLE.HELM]: {
        x: 130,
        y: 490,
        side: OFFICER_BARK_SIDE.LEFT,
    },

    [OFFICER_ROLE.WEAPONS]: {
        x: 1000,
        y: 60,
        side: OFFICER_BARK_SIDE.RIGHT,
    },

    [OFFICER_ROLE.ENGINEER]: {
        x: 1000,
        y: 275,
        side: OFFICER_BARK_SIDE.RIGHT,
    },
} satisfies Record<OfficerRole, OfficerBarkPosition>;
