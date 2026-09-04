// src/engine/encounter/model/command.ts

import type { OfficerRole } from "../../defs/officer";
import type { BeamCannonTargetNode } from "./combat";

export const ENCOUNTER_OFFICER_COMMAND_ID = {
    SCIENTIST_PLOT_COURSE: "scientist_plot_course",
    SCIENTIST_PURGE_SPAM: "scientist_purge_spam",

    SCIENTIST_FIRE_SPAM: "scientist_fire_spam",

    ENGINEER_REPAIR_DRIVE: "engineer_repair_drive",

    ENGINEER_DEPLOY_SHIELD: "engineer_deploy_shield",

    GUNNER_INTERCEPT_MISSILE: "gunner_intercept_missile",

    GUNNER_FIRE_MISSILE: "gunner_fire_missile",

    GUNNER_FIRE_STICKY_MINES: "gunner_fire_sticky_mines",

    GUNNER_FIRE_BEAM_CANNON: "gunner_fire_beam_cannon",

    PILOT_DOCK: "pilot_dock",
    PILOT_FLY_TO: "pilot_fly_to",
    PILOT_JUMP: "pilot_jump",
    PILOT_EVADE: "pilot_evade",

    CLEAR_STICKY_MINE: "clear_sticky_mine",
} as const;

export type EncounterOfficerCommandId =
    (typeof ENCOUNTER_OFFICER_COMMAND_ID)[keyof typeof ENCOUNTER_OFFICER_COMMAND_ID];

export type GunnerDefenseTurretCommandId = typeof ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_INTERCEPT_MISSILE;

// #region Command targets

export const OFFICER_COMMAND_TARGET_KIND = {
    NONE: "none",
    ANCHOR: "anchor",
    ACTOR: "actor",

    // Полностью разрешённая команда
    // физического player weapon:
    // - конкретный установленный экземпляр;
    // - конкретный enemy actor.
    ACTOR_WEAPON: "actor_weapon",

    PLAYER_SHIP_NODE: "player_ship_node",

    SPACE_NODE: "space_node",
    THREAT: "threat",
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
          kind: typeof OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON;

          weaponId: string;
          actorId: string;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.PLAYER_SHIP_NODE;

          targetNode: BeamCannonTargetNode;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.SPACE_NODE;

          nodeId: string;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.THREAT;

          threatId: string;
      };

// #endregion

// #region Command definitions

export const ENCOUNTER_ANCHOR_TARGET_SCOPE = {
    CURRENT_ANCHOR: "current_anchor",
    ENCOUNTER_NODE: "encounter_node",
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
          kind: typeof OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.PLAYER_SHIP_NODE;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.SPACE_NODE;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.THREAT;
      };

export type OfficerCommandDef = {
    role: OfficerRole;

    label: string;

    targeting: OfficerCommandTargeting;

    // Нужен ли рабочий main drive.
    // Маневровые Pilot-команды смогут
    // явно оставлять это значение false.
    requiresOnlineDrive: boolean;

    // Команду можно начать только тогда,
    // когда на мостике нет активных officer tasks.
    requiresIdleBridge: boolean;
};

// #endregion

// #region Available commands

export type AvailableOfficerCommand = {
    commandId: EncounterOfficerCommandId;

    target: OfficerCommandTarget;
};

// #endregion

// #region Command execution

export type ExecuteOfficerCommandInput = {
    role: OfficerRole;

    commandId: EncounterOfficerCommandId;

    target: OfficerCommandTarget;
};

export const OFFICER_COMMAND_EXECUTION_STATUS = {
    EXECUTED: "executed",
    REJECTED: "rejected",
} as const;

export const OFFICER_COMMAND_REJECTION_REASON = {
    NOT_AVAILABLE: "not_available",
    OFFICERS_BUSY: "officers_busy",
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
