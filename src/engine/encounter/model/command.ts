// src/engine/encounter/model/command.ts

import type { OfficerRole } from '../../defs/officer';

// Стабильные id команд, которые капитан может отдать офицерам внутри encounter.
// Id описывает намерение игрока, а не конкретный пункт меню или runtime-задачу.
export const ENCOUNTER_OFFICER_COMMAND_ID = {
    HAIL: 'hail',
    REQUEST_DOCKING: 'request_docking',
    DOCK: 'dock',
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
