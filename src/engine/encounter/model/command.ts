// src/engine/encounter/model/command.ts

import { OFFICER_ROLE, type OfficerRole } from '../../defs/officer';

// Стабильные ids команд, которые капитан может отдать
// офицерам внутри encounter.
//
// Id описывает намерение игрока,
// а не конкретный пункт меню или runtime task.
export const ENCOUNTER_OFFICER_COMMAND_ID = {
    COMMS_HAIL: 'comms_hail',
    COMMS_REQUEST_DOCKING: 'comms_request_docking',

    SCIENCE_PLOT_COURSE: 'science_plot_course',

    HELM_DOCK: 'helm_dock',
    HELM_FLY_TO: 'helm_fly_to',
} as const;

export type EncounterOfficerCommandId =
    (typeof ENCOUNTER_OFFICER_COMMAND_ID)[keyof typeof ENCOUNTER_OFFICER_COMMAND_ID];

// #region Command definitions

// Тип domain-цели, к которой применяется officer command.
//
// NONE используется для команд,
// которые не требуют выбора конкретной цели.
//
// ENCOUNTER_OBJECT используется для команд,
// направленных на объекты текущего encounter.
export const OFFICER_COMMAND_TARGET_KIND = {
    NONE: 'none',
    ENCOUNTER_OBJECT: 'encounter_object',
} as const;

export type OfficerCommandTargetKind = (typeof OFFICER_COMMAND_TARGET_KIND)[keyof typeof OFFICER_COMMAND_TARGET_KIND];

// Пространственный scope команды,
// которая применяется к encounter object.
export const ENCOUNTER_OBJECT_TARGET_SCOPE = {
    CURRENT_ANCHOR: 'current_anchor',
    ENCOUNTER_NODE: 'encounter_node',
} as const;

export type EncounterObjectTargetScope =
    (typeof ENCOUNTER_OBJECT_TARGET_SCOPE)[keyof typeof ENCOUNTER_OBJECT_TARGET_SCOPE];

// Неизменяемое описание допустимой цели officer command.
export type OfficerCommandTargeting =
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.NONE;
      }
    | {
          kind: typeof OFFICER_COMMAND_TARGET_KIND.ENCOUNTER_OBJECT;
          scope: EncounterObjectTargetScope;
      };

// Неизменяемые свойства officer command.
//
// Динамические условия доступности сюда не входят.
// Например:
// - docking clearance;
// - текущее navigation state;
// - наличие повреждений корабельной системы.
export type OfficerCommandDef = {
    role: OfficerRole;
    label: string;
    targeting: OfficerCommandTargeting;

    // Команду можно начать только тогда,
    // когда на мостике нет активных officer tasks.
    requiresIdleBridge: boolean;
};

// Единый registry статических свойств officer commands.
//
// Encounter objects хранят только ids команд,
// направленных на encounter objects.
//
// Нетаргетированные команды доступны напрямую
// через registry.
//
// Role, label, targeting и bridge requirement
// остальные системы получают отсюда.
export const OFFICER_COMMAND_DEFS = {
    [ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL]: {
        role: OFFICER_ROLE.COMMS,
        label: 'HAIL',
        targeting: {
            kind: OFFICER_COMMAND_TARGET_KIND.ENCOUNTER_OBJECT,
            scope: ENCOUNTER_OBJECT_TARGET_SCOPE.CURRENT_ANCHOR,
        },
        requiresIdleBridge: false,
    },

    [ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING]: {
        role: OFFICER_ROLE.COMMS,
        label: 'REQUEST DOCKING',
        targeting: {
            kind: OFFICER_COMMAND_TARGET_KIND.ENCOUNTER_OBJECT,
            scope: ENCOUNTER_OBJECT_TARGET_SCOPE.CURRENT_ANCHOR,
        },
        requiresIdleBridge: false,
    },

    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE]: {
        role: OFFICER_ROLE.SCIENCE,
        label: 'PLOT COURSE',
        targeting: {
            kind: OFFICER_COMMAND_TARGET_KIND.NONE,
        },
        requiresIdleBridge: false,
    },

    [ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK]: {
        role: OFFICER_ROLE.HELM,
        label: 'DOCK',
        targeting: {
            kind: OFFICER_COMMAND_TARGET_KIND.ENCOUNTER_OBJECT,
            scope: ENCOUNTER_OBJECT_TARGET_SCOPE.CURRENT_ANCHOR,
        },
        requiresIdleBridge: true,
    },

    [ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO]: {
        role: OFFICER_ROLE.HELM,
        label: 'FLY TO',
        targeting: {
            kind: OFFICER_COMMAND_TARGET_KIND.ENCOUNTER_OBJECT,
            scope: ENCOUNTER_OBJECT_TARGET_SCOPE.ENCOUNTER_NODE,
        },
        requiresIdleBridge: true,
    },
} satisfies Record<EncounterOfficerCommandId, OfficerCommandDef>;

export function getOfficerCommandDef(commandId: EncounterOfficerCommandId): OfficerCommandDef {
    return OFFICER_COMMAND_DEFS[commandId];
}

// #endregion

// #region Available commands

// Команда офицера, доступная игроку
// в текущем состоянии encounter.
//
// Это resolved menu item:
// с label и, если нужно, конкретной целью.
export type AvailableOfficerCommand = {
    commandId: EncounterOfficerCommandId;
    label: string;
    targetId?: string;
    targetLabel?: string;
};

// #endregion

// #region Command execution

// Входной payload выполнения команды
// после выбора игроком.
//
// Engine всё равно должен повторно проверить,
// что команда сейчас валидна.
export type ExecuteOfficerCommandInput = {
    role: OfficerRole;
    commandId: EncounterOfficerCommandId;
    targetId?: string;
};

export const OFFICER_COMMAND_EXECUTION_STATUS = {
    EXECUTED: 'executed',
    REJECTED: 'rejected',
} as const;

export const OFFICER_COMMAND_REJECTION_REASON = {
    NOT_AVAILABLE: 'not_available',
    OFFICERS_BUSY: 'officers_busy',
} as const;

// Результат попытки выполнить officer command.
//
// NOT_AVAILABLE означает, что выбранная команда
// уже невалидна для текущего encounter state.
//
// OFFICERS_BUSY используется для команд,
// которым требуется полностью свободный мостик.
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
