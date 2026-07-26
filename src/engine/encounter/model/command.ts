// src/engine/encounter/model/command.ts

import type { OfficerRole } from '../../defs/officer';

export const ENCOUNTER_OFFICER_COMMAND_ID = {
    COMMS_HAIL: 'comms_hail',
    COMMS_REQUEST_DOCKING: 'comms_request_docking',

    SCIENCE_PLOT_COURSE: 'science_plot_course',

    HELM_DOCK: 'helm_dock',
    HELM_FLY_TO: 'helm_fly_to',
    HELM_JUMP: 'helm_jump',
} as const;

export type EncounterOfficerCommandId =
    (typeof ENCOUNTER_OFFICER_COMMAND_ID)[keyof typeof ENCOUNTER_OFFICER_COMMAND_ID];

// #region Command targets

export const OFFICER_COMMAND_TARGET_KIND = {
    NONE: 'none',
    ANCHOR: 'anchor',
    ACTOR: 'actor',
    SPACE_NODE: 'space_node',
} as const;

export type OfficerCommandTargetKind = (typeof OFFICER_COMMAND_TARGET_KIND)[keyof typeof OFFICER_COMMAND_TARGET_KIND];

export type OfficerCommandTarget =
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.NONE;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.ANCHOR;
          anchorId: string;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.ACTOR;
          actorId: string;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.SPACE_NODE;
          nodeId: string;
      };

// #endregion

// #region Command definitions

export const ENCOUNTER_ANCHOR_TARGET_SCOPE = {
    CURRENT_ANCHOR: 'current_anchor',
    ENCOUNTER_NODE: 'encounter_node',
} as const;

export type EncounterAnchorTargetScope =
    (typeof ENCOUNTER_ANCHOR_TARGET_SCOPE)[keyof typeof ENCOUNTER_ANCHOR_TARGET_SCOPE];

export type OfficerCommandTargeting =
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.NONE;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.ANCHOR;
          scope: EncounterAnchorTargetScope;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.ACTOR;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.SPACE_NODE;
      };

export type OfficerCommandDef = {
    role: OfficerRole;
    label: string;
    targeting: OfficerCommandTargeting;

    // Команду можно начать только тогда,
    // когда на мостике нет активных officer tasks.
    requiresIdleBridge: boolean;
};

// #endregion

// #region Available commands

export type AvailableOfficerCommand = {
    commandId: EncounterOfficerCommandId;
    label: string;

    target: OfficerCommandTarget;

    targetLabel?: string;
};

// #endregion

// #region Command execution

export type ExecuteOfficerCommandInput = {
    role: OfficerRole;
    commandId: EncounterOfficerCommandId;

    target: OfficerCommandTarget;
};

export const OFFICER_COMMAND_EXECUTION_STATUS = {
    EXECUTED: 'executed',
    REJECTED: 'rejected',
} as const;

export const OFFICER_COMMAND_REJECTION_REASON = {
    NOT_AVAILABLE: 'not_available',
    OFFICERS_BUSY: 'officers_busy',
} as const;

export type ExecuteOfficerCommandResult =
    | {
          status: typeof OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED;
      }
    | {
          status: typeof OFFICER_COMMAND_EXECUTION_STATUS.REJECTED;
          reason: typeof OFFICER_COMMAND_REJECTION_REASON.NOT_AVAILABLE;
      }
    | {
          status: typeof OFFICER_COMMAND_EXECUTION_STATUS.REJECTED;
          reason: typeof OFFICER_COMMAND_REJECTION_REASON.OFFICERS_BUSY;
          busyRoles: OfficerRole[];
      };

// #endregion
