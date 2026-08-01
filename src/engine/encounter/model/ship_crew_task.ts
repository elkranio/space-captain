// src/engine/encounter/model/ship_crew_task.ts

import type {
    OfficerRole,
} from '../../defs/officer';

export const SHIP_CREW_TASK_KIND = {
    OPERATE_WEAPON: 'operate_weapon',
} as const;

export type ShipCrewTaskKind =
    (typeof SHIP_CREW_TASK_KIND)[keyof typeof SHIP_CREW_TASK_KIND];

export type OperateWeaponShipCrewTaskState = {
    kind:
        typeof SHIP_CREW_TASK_KIND
            .OPERATE_WEAPON;

    role: OfficerRole;

    weaponId: string;
};

export type ShipCrewTaskState =
    OperateWeaponShipCrewTaskState;

export type ShipCrewTaskStates =
    Partial<
        Record<
            OfficerRole,
            ShipCrewTaskState
        >
    >;
