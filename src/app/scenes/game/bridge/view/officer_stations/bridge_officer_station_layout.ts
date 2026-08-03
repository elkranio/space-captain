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

const STATION_HIT_AREA = {
    width: 242,
    height: 180,
} as const;

export const BRIDGE_OFFICER_STATION_LAYOUT = {
    [OFFICER_ROLE.SCIENCE]: {
        role: OFFICER_ROLE.SCIENCE,

        position: {
            x: 235,
            y: 443,
        },

        seatedOfficerSpriteId: BRIDGE_SEATED_OFFICER_SPRITE_ID.SCIENCE_SEATED_00,
        hitArea: STATION_HIT_AREA,

        barkPosition: {
            x: 199,
            y: 300,
            side: 'left',
        },

        contextMenuPosition: {
            x: 32,
            y: 318,
        },
    },

    [OFFICER_ROLE.WEAPONS]: {
        role: OFFICER_ROLE.WEAPONS,

        position: {
            x: 504,
            y: 399,
        },

        seatedOfficerSpriteId: BRIDGE_SEATED_OFFICER_SPRITE_ID.WEAPONS_SEATED_00,
        hitArea: STATION_HIT_AREA,

        barkPosition: {
            x: 468,
            y: 256,
            side: 'left',
        },

        contextMenuPosition: {
            x: 316,
            y: 274,
        },
    },

    [OFFICER_ROLE.HELM]: {
        role: OFFICER_ROLE.HELM,

        position: {
            x: 774,
            y: 399,
        },

        seatedOfficerSpriteId: BRIDGE_SEATED_OFFICER_SPRITE_ID.HELM_SEATED_00,
        hitArea: STATION_HIT_AREA,

        barkPosition: {
            x: 635,
            y: 256,
            side: 'right',
        },

        contextMenuPosition: {
            x: 588,
            y: 274,
        },
    },

    [OFFICER_ROLE.ENGINEER]: {
        role: OFFICER_ROLE.ENGINEER,

        position: {
            x: 1043,
            y: 443,
        },

        seatedOfficerSpriteId: BRIDGE_SEATED_OFFICER_SPRITE_ID.ENGINEER_SEATED_00,
        hitArea: STATION_HIT_AREA,

        barkPosition: {
            x: 904,
            y: 300,
            side: 'right',
        },

        contextMenuPosition: {
            x: 872,
            y: 318,
        },
    },
} as const satisfies Record<OfficerRole, BridgeOfficerStationLayoutEntry>;
