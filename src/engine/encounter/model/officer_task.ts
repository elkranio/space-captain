// src/engine/encounter/model/officer_task.ts

import { OFFICER_ROLE, type OfficerRole } from "../../defs/officer";
import { OFFICER_TASK_KIND, type OfficerTaskCancellationPolicy } from "../../defs/officer_task";
export { OFFICER_TASK_KIND, type OfficerTaskCancellationPolicy, type OfficerTaskKind } from "../../defs/officer_task";
import { ENCOUNTER_OFFICER_COMMAND_ID } from "./command";
import type { BeamCannonTargetNode } from "./combat";

type OfficerTaskDraftBase = {
    label: string;

    // Нужно ли presentation-слою показывать
    // игроку точный прогресс этой task.
    showProgress: boolean;

    durationMs: number | null;
};

type SciencePlotCourseOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE;
    role: typeof OFFICER_ROLE.SCIENCE;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE;

    targetNodeId: string;
};

type SciencePurgeSpamOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM;
    role: typeof OFFICER_ROLE.SCIENCE;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM;

    channelId: string;
};

type EngineerRepairDriveOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE;
    role: typeof OFFICER_ROLE.ENGINEER;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE;
};

type EngineerDeployShieldOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD;

    role: typeof OFFICER_ROLE.ENGINEER;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD;

    targetNode: BeamCannonTargetNode;
};

type WeaponsDefenseTurretOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.WEAPONS_DEFENSE_TURRET;
    role: typeof OFFICER_ROLE.WEAPONS;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE;

    threatId: string;
};

type WeaponsFireMissileOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.WEAPONS_FIRE_MISSILE;

    role: typeof OFFICER_ROLE.WEAPONS;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_MISSILE;

    weaponId: string;
    targetActorId: string;
};

type WeaponsFireStickyMinesOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.WEAPONS_FIRE_STICKY_MINES;

    role: typeof OFFICER_ROLE.WEAPONS;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_STICKY_MINES;

    weaponId: string;
    targetActorId: string;
};

type WeaponsFireBeamCannonOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.WEAPONS_FIRE_BEAM_CANNON;

    role: typeof OFFICER_ROLE.WEAPONS;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_BEAM_CANNON;

    weaponId: string;
    targetActorId: string;
};

type ScienceFireSpamOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.SCIENCE_FIRE_SPAM;

    role: typeof OFFICER_ROLE.SCIENCE;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_FIRE_SPAM;

    weaponId: string;
    targetActorId: string;
};

type ClearStickyMineOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.CLEAR_STICKY_MINE;
    role: OfficerRole;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE;

    mineId: string;
};

type HelmDockOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.HELM_DOCK;
    role: typeof OFFICER_ROLE.HELM;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK;

    targetAnchorId: string;
};

type HelmFlyToOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.HELM_FLY_TO;
    role: typeof OFFICER_ROLE.HELM;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO;

    targetAnchorId: string;
};

type HelmJumpOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.HELM_JUMP;
    role: typeof OFFICER_ROLE.HELM;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.HELM_JUMP;

    targetAnchorId: string;
    targetNodeId: string;
};

type HelmEvadeOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.HELM_EVADE;
    role: typeof OFFICER_ROLE.HELM;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.HELM_EVADE;
};

// Описание task до её запуска.
//
// Factory определяет содержание работы,
// но не создаёт runtime identity, progress
// или cancellation policy.
//
// Task-specific поля принадлежат только тем
// вариантам task, которым они действительно нужны.
export type OfficerTaskDraft =
    | SciencePlotCourseOfficerTaskDraft
    | SciencePurgeSpamOfficerTaskDraft
    | EngineerRepairDriveOfficerTaskDraft
    | EngineerDeployShieldOfficerTaskDraft
    | WeaponsDefenseTurretOfficerTaskDraft
    | WeaponsFireMissileOfficerTaskDraft
    | WeaponsFireStickyMinesOfficerTaskDraft
    | WeaponsFireBeamCannonOfficerTaskDraft
    | ScienceFireSpamOfficerTaskDraft
    | ClearStickyMineOfficerTaskDraft
    | HelmDockOfficerTaskDraft
    | HelmFlyToOfficerTaskDraft
    | HelmJumpOfficerTaskDraft
    | HelmEvadeOfficerTaskDraft;

// Активная runtime task.
//
// id, начальный progress и cancellation policy
// назначает OfficerTaskRunner при запуске.
export type OfficerTaskState = OfficerTaskDraft &
    OfficerTaskCancellationPolicy & {
        id: string;

        elapsedMs: number;
    };

export type OfficerTaskStates = Partial<Record<OfficerRole, OfficerTaskState>>;
