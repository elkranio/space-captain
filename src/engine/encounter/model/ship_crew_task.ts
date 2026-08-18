// src/engine/encounter/model/ship_crew_task.ts

import { OFFICER_ROLE, type OfficerRole } from "../../defs/officer";

export const SHIP_CREW_TASK_KIND = {
    OPERATE_WEAPON: "operate_weapon",

    INTERCEPT_MISSILE: "intercept_missile",

    CLEAR_STICKY_MINE: "clear_sticky_mine",

    IDENTIFY_THREAT: "identify_threat",

    PURGE_SPAM: "purge_spam",

    DEPLOY_SHIELD: "deploy_shield",
} as const;

export type ShipCrewTaskKind = (typeof SHIP_CREW_TASK_KIND)[keyof typeof SHIP_CREW_TASK_KIND];

export type ShipCrewTaskBaseState = {
    role: OfficerRole;
};

export type OperateWeaponShipCrewTaskState = ShipCrewTaskBaseState & {
    kind: typeof SHIP_CREW_TASK_KIND.OPERATE_WEAPON;

    weaponId: string;
};

export type InterceptMissileShipCrewTaskState = ShipCrewTaskBaseState & {
    kind: typeof SHIP_CREW_TASK_KIND.INTERCEPT_MISSILE;

    role: typeof OFFICER_ROLE.WEAPONS;

    // Runtime id of the installed system.
    defenseTurretId: string;

    projectileId: string;
};

export type ClearStickyMineShipCrewTaskState = ShipCrewTaskBaseState & {
    kind: typeof SHIP_CREW_TASK_KIND.CLEAR_STICKY_MINE;

    role: typeof OFFICER_ROLE.ENGINEER;

    mineId: string;

    elapsedMs: number;
    durationMs: number;
};

export type IdentifyThreatShipCrewTaskState = ShipCrewTaskBaseState & {
    kind: typeof SHIP_CREW_TASK_KIND.IDENTIFY_THREAT;

    role: typeof OFFICER_ROLE.SCIENCE;

    observationId: string;

    elapsedMs: number;
    durationMs: number;
};

export type PurgeSpamShipCrewTaskState = ShipCrewTaskBaseState & {
    kind: typeof SHIP_CREW_TASK_KIND.PURGE_SPAM;

    role: typeof OFFICER_ROLE.SCIENCE;

    channelId: string;

    elapsedMs: number;
    durationMs: number;
};

export type DeployShieldShipCrewTaskState = ShipCrewTaskBaseState & {
    kind: typeof SHIP_CREW_TASK_KIND.DEPLOY_SHIELD;

    role: typeof OFFICER_ROLE.ENGINEER;

    observationId: string;

    elapsedMs: number;
    durationMs: number;
};

export type ShipCrewTaskState =
    | OperateWeaponShipCrewTaskState
    | InterceptMissileShipCrewTaskState
    | ClearStickyMineShipCrewTaskState
    | IdentifyThreatShipCrewTaskState
    | PurgeSpamShipCrewTaskState
    | DeployShieldShipCrewTaskState;

export type ShipCrewTaskStates = Partial<Record<OfficerRole, ShipCrewTaskState>>;
