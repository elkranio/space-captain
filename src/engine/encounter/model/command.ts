// src/engine/encounter/model/command.ts

import type {
    OfficerRole,
} from '../../defs/officer';

export const ENCOUNTER_OFFICER_COMMAND_ID = {
    SCIENCE_PLOT_COURSE:
        'science_plot_course',
    SCIENCE_IDENTIFY_THREAT:
        'science_identify_threat',
    SCIENCE_PURGE_SPAM:
        'science_purge_spam',

    SCIENCE_FIRE_SPAM:
        'science_fire_spam',


    ENGINEER_REPAIR_DRIVE:
        'engineer_repair_drive',

    ENGINEER_DEPLOY_SHIELD:
        'engineer_deploy_shield',

    WEAPONS_FIRE_RED_BEAM:
        'weapons_fire_red_beam',
    WEAPONS_FIRE_BLUE_BEAM:
        'weapons_fire_blue_beam',

    WEAPONS_FIRE_MISSILE:
        'weapons_fire_missile',

    WEAPONS_FIRE_STICKY_MINES:
        'weapons_fire_sticky_mines',

    WEAPONS_FIRE_LASER:
        'weapons_fire_laser',

    HELM_DOCK: 'helm_dock',
    HELM_FLY_TO: 'helm_fly_to',
    HELM_JUMP: 'helm_jump',

    CLEAR_STICKY_MINE:
        'clear_sticky_mine',
} as const;

export type EncounterOfficerCommandId =
    (typeof ENCOUNTER_OFFICER_COMMAND_ID)[keyof typeof ENCOUNTER_OFFICER_COMMAND_ID];


export type WeaponsDefenseTurretCommandId =
    | typeof ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM
    | typeof ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_BLUE_BEAM;

// #region Command targets

export const OFFICER_COMMAND_TARGET_KIND = {
    NONE: 'none',
    ANCHOR: 'anchor',
    ACTOR: 'actor',

    // Полностью разрешённая команда
    // физического player weapon:
    // - конкретный установленный экземпляр;
    // - конкретный enemy actor.
    ACTOR_WEAPON:
        'actor_weapon',

    SPACE_NODE: 'space_node',
    THREAT: 'threat',
} as const;

export type OfficerCommandTargetKind =
    (typeof OFFICER_COMMAND_TARGET_KIND)[keyof typeof OFFICER_COMMAND_TARGET_KIND];

export type OfficerCommandTarget =
    | {
          kind:
              typeof OFFICER_COMMAND_TARGET_KIND.NONE;
      }
    | {
          kind:
              typeof OFFICER_COMMAND_TARGET_KIND.ANCHOR;

          anchorId: string;
      }
    | {
          kind:
              typeof OFFICER_COMMAND_TARGET_KIND.ACTOR;

          actorId: string;
      }
    | {
          kind:
              typeof OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON;

          weaponId: string;
          actorId: string;
      }
    | {
          kind:
              typeof OFFICER_COMMAND_TARGET_KIND.SPACE_NODE;

          nodeId: string;
      }
    | {
          kind:
              typeof OFFICER_COMMAND_TARGET_KIND.THREAT;

          threatId: string;
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
          kind:
              typeof OFFICER_COMMAND_TARGET_KIND.NONE;
      }
    | {
          kind:
              typeof OFFICER_COMMAND_TARGET_KIND.ANCHOR;

          scope: EncounterAnchorTargetScope;
      }
    | {
          kind:
              typeof OFFICER_COMMAND_TARGET_KIND.ACTOR;
      }
    | {
          kind:
              typeof OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON;
      }
    | {
          kind:
              typeof OFFICER_COMMAND_TARGET_KIND.SPACE_NODE;
      }
    | {
          kind:
              typeof OFFICER_COMMAND_TARGET_KIND.THREAT;
      };

export type OfficerCommandDef = {
    availableToRoles:
        readonly OfficerRole[];

    label: string;

    targeting: OfficerCommandTargeting;

    // Нужен ли рабочий main drive.
    // Маневровые Helm-команды смогут
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

    label: string;

    target: OfficerCommandTarget;

    targetLabel?: string;
};

// #endregion

// #region Command execution

export type ExecuteOfficerCommandInput = {
    role: OfficerRole;

    commandId:
        EncounterOfficerCommandId;

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
          status:
              typeof OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED;
      }
    | {
          status:
              typeof OFFICER_COMMAND_EXECUTION_STATUS.REJECTED;

          reason:
              typeof OFFICER_COMMAND_REJECTION_REASON.NOT_AVAILABLE;
      }
    | {
          status:
              typeof OFFICER_COMMAND_EXECUTION_STATUS.REJECTED;

          reason:
              typeof OFFICER_COMMAND_REJECTION_REASON.OFFICERS_BUSY;

          busyRoles: OfficerRole[];
      };

// #endregion
