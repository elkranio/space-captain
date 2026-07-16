// src/engine/encounter/commands/queries/try_create_available_officer_command_for_object.ts

import { ENCOUNTER_OFFICER_COMMAND_ID, type AvailableOfficerCommand } from '../../model/command';
import type { EncounterObjectOfficerCommand, EncounterObjectState } from '../../objects/encounter_object';
import { tryCreateAvailableDockCommand } from './helm/dock/try_create_available_dock_command';
import { tryCreateAvailableHailCommand } from './comms/hail/try_create_available_hail_command';
import { tryCreateAvailableRequestDockingCommand } from './comms/request_docking/try_create_available_request_docking_command';

// Выбирает command-specific creator для object command.
// Проверка роли выполняется выше, а правила доступности живут внутри файлов конкретных команд.
export function tryCreateAvailableOfficerCommandForObject(
    object: EncounterObjectState,
    objectCommand: EncounterObjectOfficerCommand,
): AvailableOfficerCommand | undefined {
    switch (objectCommand.commandId) {
        case ENCOUNTER_OFFICER_COMMAND_ID.HAIL:
            return tryCreateAvailableHailCommand(object);

        case ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING:
            return tryCreateAvailableRequestDockingCommand(object);

        case ENCOUNTER_OFFICER_COMMAND_ID.DOCK:
            return tryCreateAvailableDockCommand(object);
    }

    throw new Error(`Unhandled encounter officer command: ${String(objectCommand.commandId)}`);
}
