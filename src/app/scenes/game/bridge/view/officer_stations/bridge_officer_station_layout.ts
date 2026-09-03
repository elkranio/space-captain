// src/app/scenes/game/bridge/view/officer_stations/bridge_officer_station_layout.ts
import { OFFICER_ROLE, type OfficerRole } from "../../../../../../engine/defs/officer";
import {
    BRIDGE_SEATED_OFFICER_SPRITE_ID,
    type BridgeSeatedOfficerSpriteId,
} from "../../../../../manifests/bridge/seated_officer";

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

};

const OFFICER_HIT_AREA = {
    width: 200,
    height: 180,
} as const;

export const BRIDGE_OFFICER_STATION_LAYOUT = {
    [OFFICER_ROLE.SCIENCE]: {
        role: OFFICER_ROLE.SCIENCE,

        position: {
            x: 100,
            y: 116,
        },

        seatedOfficerSpriteId: BRIDGE_SEATED_OFFICER_SPRITE_ID.SCIENCE_IDLE,
        flipX: false,
        hitArea: OFFICER_HIT_AREA,

    },

    [OFFICER_ROLE.HELM]: {
        role: OFFICER_ROLE.HELM,

        position: {
            x: 100,
            y: 296,
        },

        seatedOfficerSpriteId: BRIDGE_SEATED_OFFICER_SPRITE_ID.HELM_IDLE,
        flipX: false,
        hitArea: OFFICER_HIT_AREA,

    },

    [OFFICER_ROLE.WEAPONS]: {
        role: OFFICER_ROLE.WEAPONS,

        position: {
            x: 1180,
            y: 116,
        },

        seatedOfficerSpriteId: BRIDGE_SEATED_OFFICER_SPRITE_ID.WEAPONS_IDLE,
        flipX: true,
        hitArea: OFFICER_HIT_AREA,

    },

    [OFFICER_ROLE.ENGINEER]: {
        role: OFFICER_ROLE.ENGINEER,

        position: {
            x: 1180,
            y: 296,
        },

        seatedOfficerSpriteId: BRIDGE_SEATED_OFFICER_SPRITE_ID.ENGINEER_IDLE,
        flipX: true,
        hitArea: OFFICER_HIT_AREA,

    },
} as const satisfies Record<OfficerRole, BridgeOfficerStationLayoutEntry>;
