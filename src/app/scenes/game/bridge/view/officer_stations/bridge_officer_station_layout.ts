import { OFFICER_ROLE, type OfficerRole } from '../../../../../../engine/defs/officer';
import {
    BRIDGE_SEATED_OFFICER_SPRITE_ID,
    type BridgeSeatedOfficerSpriteId,
} from '../../../../../manifests/bridge/seated_officer';

export type BridgeOfficerStationLayoutEntry = {
    role: OfficerRole;

    position: {
        x: number;
        y: number;
    };

    seatedOfficerSpriteId: BridgeSeatedOfficerSpriteId;
    flipX: boolean;

    hitArea: {
        width: number;
        height: number;
    };

    barkPosition: {
        x: number;
        y: number;
        side: 'left' | 'right';
    };

    contextMenuPosition: {
        x: number;
        y: number;
    };
};

const OFFICER_HIT_AREA = {
    width: 160,
    height: 170,
} as const;

export const BRIDGE_OFFICER_STATION_LAYOUT = {
    [OFFICER_ROLE.SCIENCE]: {
        role: OFFICER_ROLE.SCIENCE,

        position: {
            x: 303,
            y: 416,
        },

        seatedOfficerSpriteId:
            BRIDGE_SEATED_OFFICER_SPRITE_ID
                .SCIENCE_SEATED_01_IDLE,
        flipX: false,
        hitArea: OFFICER_HIT_AREA,

        barkPosition: {
            x: 267,
            y: 273,
            side: 'left',
        },

        contextMenuPosition: {
            x: 115,
            y: 291,
        },
    },

    [OFFICER_ROLE.HELM]: {
        role: OFFICER_ROLE.HELM,

        position: {
            x: 523,
            y: 416,
        },

        seatedOfficerSpriteId:
            BRIDGE_SEATED_OFFICER_SPRITE_ID
                .HELM_SEATED_01_IDLE,
        flipX: false,
        hitArea: OFFICER_HIT_AREA,

        barkPosition: {
            x: 487,
            y: 273,
            side: 'left',
        },

        contextMenuPosition: {
            x: 335,
            y: 291,
        },
    },

    [OFFICER_ROLE.WEAPONS]: {
        role: OFFICER_ROLE.WEAPONS,

        position: {
            x: 765,
            y: 416,
        },

        seatedOfficerSpriteId:
            BRIDGE_SEATED_OFFICER_SPRITE_ID
                .WEAPONS_SEATED_01_IDLE,
        flipX: true,
        hitArea: OFFICER_HIT_AREA,

        barkPosition: {
            x: 626,
            y: 273,
            side: 'right',
        },

        contextMenuPosition: {
            x: 577,
            y: 291,
        },
    },

    [OFFICER_ROLE.ENGINEER]: {
        role: OFFICER_ROLE.ENGINEER,

        position: {
            x: 976,
            y: 416,
        },

        seatedOfficerSpriteId:
            BRIDGE_SEATED_OFFICER_SPRITE_ID
                .ENGINEER_SEATED_01_IDLE,
        flipX: true,
        hitArea: OFFICER_HIT_AREA,

        barkPosition: {
            x: 837,
            y: 273,
            side: 'right',
        },

        contextMenuPosition: {
            x: 788,
            y: 291,
        },
    },
} as const satisfies Record<
    OfficerRole,
    BridgeOfficerStationLayoutEntry
>;
