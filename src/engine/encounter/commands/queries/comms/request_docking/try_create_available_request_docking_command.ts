// src/engine/encounter/commands/queries/comms/request_docking/try_create_available_request_docking_command.ts

import { ENCOUNTER_OFFICER_COMMAND_ID, type AvailableOfficerCommand } from '../../../../model/command';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectState } from '../../../../objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from '../../../../objects/station/station_encounter_object';
import { createTargetedOfficerCommand } from '../../shared/create_targeted_officer_command';

// Создаёт REQUEST DOCKING-команду только для станции без текущего docking clearance.
// Проверка роли и наличие команды в object.officerCommands выполняются выше.
export function tryCreateAvailableRequestDockingCommand(
    object: EncounterObjectState,
): AvailableOfficerCommand | undefined {
    if (object.kind !== ENCOUNTER_OBJECT_KIND.STATION) {
        return undefined;
    }

    if (object.docking.clearance !== DOCKING_CLEARANCE_STATE.NONE) {
        return undefined;
    }

    return createTargetedOfficerCommand({
        commandId: ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING,
        label: 'REQUEST DOCKING',
        target: object,
    });
}
