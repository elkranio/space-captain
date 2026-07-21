// src/engine/encounter/commands/queries/try_create_available_officer_command_for_object.ts

import { ENCOUNTER_OFFICER_COMMAND_ID, type AvailableOfficerCommand } from '../../model/command';
import type { EncounterState } from '../../model/state';
import type { EncounterObjectOfficerCommand, EncounterObjectState } from '../../objects/encounter_object';
import { tryCreateAvailableHailCommand } from './comms/hail/try_create_available_hail_command';
import { tryCreateAvailableRequestDockingCommand } from './comms/request_docking/try_create_available_request_docking_command';
import { tryCreateAvailableDockCommand } from './helm/dock/try_create_available_dock_command';
import { tryCreateAvailableFlyToCommand } from './helm/fly_to/try_create_available_fly_to_command';

// Выбирает command-specific creator для object command.
// Проверка роли выполняется выше, а правила доступности живут внутри файлов конкретных команд.
export function tryCreateAvailableOfficerCommandForObject(
    state: EncounterState,
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

        case ENCOUNTER_OFFICER_COMMAND_ID.FLY_TO:
            return tryCreateAvailableFlyToCommand(state, object);
    }

    throw new Error(`Unhandled encounter officer command: ${String(objectCommand.commandId)}`);
}
