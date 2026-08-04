// src/engine/encounter/model/ship_crew_task.ts

import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../defs/officer';
import type {
    PointDefenseBeamBand,
} from '../../defs/point_defense';

export const SHIP_CREW_TASK_KIND = {
    OPERATE_WEAPON: 'operate_weapon',

    INTERCEPT_MISSILE:
        'intercept_missile',

    IDENTIFY_THREAT:
        'identify_threat',
} as const;

export type ShipCrewTaskKind =
    (typeof SHIP_CREW_TASK_KIND)[keyof typeof SHIP_CREW_TASK_KIND];

export type ShipCrewTaskBaseState = {
    role: OfficerRole;
};

export type OperateWeaponShipCrewTaskState =
    ShipCrewTaskBaseState & {
        kind:
            typeof SHIP_CREW_TASK_KIND
                .OPERATE_WEAPON;

        weaponId: string;
    };

export type InterceptMissileShipCrewTaskState =
    ShipCrewTaskBaseState & {
        kind:
            typeof SHIP_CREW_TASK_KIND
                .INTERCEPT_MISSILE;

        role:
            typeof OFFICER_ROLE.WEAPONS;

        // Runtime id of the installed system.
        pointDefenseId: string;

        projectileId: string;
        beamBand: PointDefenseBeamBand;
    };

export type IdentifyThreatShipCrewTaskState =
    ShipCrewTaskBaseState & {
        kind:
            typeof SHIP_CREW_TASK_KIND
                .IDENTIFY_THREAT;

        role:
            typeof OFFICER_ROLE.SCIENCE;

        observationId: string;

        elapsedMs: number;
        durationMs: number;
    };

export type ShipCrewTaskState =
    | OperateWeaponShipCrewTaskState
    | InterceptMissileShipCrewTaskState
    | IdentifyThreatShipCrewTaskState;

export type ShipCrewTaskStates =
    Partial<
        Record<
            OfficerRole,
            ShipCrewTaskState
        >
    >;
