// src/engine/encounter/model/ship_crew_task.ts

import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../defs/officer';

export const SHIP_CREW_TASK_KIND = {
    OPERATE_WEAPON: 'operate_weapon',

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
    | IdentifyThreatShipCrewTaskState;

export type ShipCrewTaskStates =
    Partial<
        Record<
            OfficerRole,
            ShipCrewTaskState
        >
    >;
