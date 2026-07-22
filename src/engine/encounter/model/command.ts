// src/engine/encounter/model/command.ts

import type { OfficerRole } from '../../defs/officer';

// Стабильные id команд, которые капитан может отдать офицерам внутри encounter.
// Id описывает намерение игрока, а не конкретный пункт меню или runtime-задачу.
export const ENCOUNTER_OFFICER_COMMAND_ID = {
    HAIL: 'hail',
    REQUEST_DOCKING: 'request_docking',
    DOCK: 'dock',
    FLY_TO: 'fly_to',
} as const;

export type EncounterOfficerCommandId =
    (typeof ENCOUNTER_OFFICER_COMMAND_ID)[keyof typeof ENCOUNTER_OFFICER_COMMAND_ID];

// Команда офицера, доступная игроку в текущем состоянии encounter.
// Это уже resolved menu item: с label и, если нужно, конкретной целью.
export type AvailableOfficerCommand = {
    commandId: EncounterOfficerCommandId;
    label: string;
    targetId?: string;
    targetLabel?: string;
};

// Входной payload выполнения команды после выбора игроком.
// Engine всё равно должен повторно проверить, что команда сейчас валидна.
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
// NOT_AVAILABLE означает, что выбранная команда уже невалидна
// для текущего encounter state.
//
// OFFICERS_BUSY используется для exclusive bridge operations,
// которым требуется полностью свободный экипаж.
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
