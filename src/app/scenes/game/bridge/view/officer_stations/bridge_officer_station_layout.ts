// src/app/scenes/game/bridge/view/officer_stations/bridge_officer_station_layout.ts
import { OFFICER_ROLE, type OfficerRole } from "../../../../../../engine/defs/officer";

export type BridgeOfficerStationLayoutEntry = {
    role: OfficerRole;

    position: {
        x: number;
        y: number;
    };

    alignRight: boolean;
    monitorWidth: number;
};

const OFFICER_MONITOR_WIDTH = 200;

export const BRIDGE_OFFICER_STATION_LAYOUT = {
    [OFFICER_ROLE.SCIENTIST]: {
        role: OFFICER_ROLE.SCIENTIST,

        position: {
            x: 98,
            y: 121,
        },

        alignRight: false,
        monitorWidth: OFFICER_MONITOR_WIDTH,
    },

    [OFFICER_ROLE.PILOT]: {
        role: OFFICER_ROLE.PILOT,

        position: {
            x: 98,
            y: 291,
        },

        alignRight: false,
        monitorWidth: OFFICER_MONITOR_WIDTH,
    },

    [OFFICER_ROLE.GUNNER]: {
        role: OFFICER_ROLE.GUNNER,

        position: {
            x: 1182,
            y: 121,
        },

        alignRight: true,
        monitorWidth: OFFICER_MONITOR_WIDTH,
    },

    [OFFICER_ROLE.ENGINEER]: {
        role: OFFICER_ROLE.ENGINEER,

        position: {
            x: 1182,
            y: 291,
        },

        alignRight: true,
        monitorWidth: OFFICER_MONITOR_WIDTH,
    },
} as const satisfies Record<OfficerRole, BridgeOfficerStationLayoutEntry>;
