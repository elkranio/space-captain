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

type ScientistPlotCourseOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.SCIENTIST_PLOT_COURSE;
    role: typeof OFFICER_ROLE.SCIENTIST;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PLOT_COURSE;

    targetNodeId: string;
};

type ScientistPurgeSpamOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.SCIENTIST_PURGE_SPAM;
    role: typeof OFFICER_ROLE.SCIENTIST;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PURGE_SPAM;

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

type GunnerDefenseTurretOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.GUNNER_DEFENSE_TURRET;
    role: typeof OFFICER_ROLE.GUNNER;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_INTERCEPT_MISSILE;

    threatId: string;
};

type GunnerFireMissileOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.GUNNER_FIRE_MISSILE;

    role: typeof OFFICER_ROLE.GUNNER;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_MISSILE;

    weaponId: string;
    targetActorId: string;
};

type GunnerFireStickyMinesOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.GUNNER_FIRE_STICKY_MINES;

    role: typeof OFFICER_ROLE.GUNNER;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_STICKY_MINES;

    weaponId: string;
    targetActorId: string;
};

type GunnerFireBeamCannonOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.GUNNER_FIRE_BEAM_CANNON;

    role: typeof OFFICER_ROLE.GUNNER;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_BEAM_CANNON;

    weaponId: string;
    targetActorId: string;
};

type ScientistFireSpamOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.SCIENTIST_FIRE_SPAM;

    role: typeof OFFICER_ROLE.SCIENTIST;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_FIRE_SPAM;

    weaponId: string;
    targetActorId: string;
};

type ClearStickyMineOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.CLEAR_STICKY_MINE;
    role: OfficerRole;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE;

    mineId: string;
};

type PilotDockOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.PILOT_DOCK;
    role: typeof OFFICER_ROLE.PILOT;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.PILOT_DOCK;

    targetAnchorId: string;
};

type PilotFlyToOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.PILOT_FLY_TO;
    role: typeof OFFICER_ROLE.PILOT;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.PILOT_FLY_TO;

    targetAnchorId: string;
};

type PilotJumpOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.PILOT_JUMP;
    role: typeof OFFICER_ROLE.PILOT;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.PILOT_JUMP;

    targetAnchorId: string;
    targetNodeId: string;
};

type PilotEvadeOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.PILOT_EVADE;
    role: typeof OFFICER_ROLE.PILOT;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.PILOT_EVADE;
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
    | ScientistPlotCourseOfficerTaskDraft
    | ScientistPurgeSpamOfficerTaskDraft
    | EngineerRepairDriveOfficerTaskDraft
    | EngineerDeployShieldOfficerTaskDraft
    | GunnerDefenseTurretOfficerTaskDraft
    | GunnerFireMissileOfficerTaskDraft
    | GunnerFireStickyMinesOfficerTaskDraft
    | GunnerFireBeamCannonOfficerTaskDraft
    | ScientistFireSpamOfficerTaskDraft
    | ClearStickyMineOfficerTaskDraft
    | PilotDockOfficerTaskDraft
    | PilotFlyToOfficerTaskDraft
    | PilotJumpOfficerTaskDraft
    | PilotEvadeOfficerTaskDraft;

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
