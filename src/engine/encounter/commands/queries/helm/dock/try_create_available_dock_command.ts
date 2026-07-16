// src/engine/encounter/commands/queries/helm/dock/try_create_available_dock_command.ts

import { ENCOUNTER_OFFICER_COMMAND_ID, type AvailableOfficerCommand } from '../../../../model/command';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectState } from '../../../../objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from '../../../../objects/station/station_encounter_object';
import { createTargetedOfficerCommand } from '../../shared/create_targeted_officer_command';

// Создаёт DOCK-команду только для станции с выданным docking clearance.
// Проверка роли и наличие команды в object.officerCommands выполняются выше.
export function tryCreateAvailableDockCommand(object: EncounterObjectState): AvailableOfficerCommand | undefined {
    if (object.kind !== ENCOUNTER_OBJECT_KIND.STATION) {
        return undefined;
    }

    if (object.docking.clearance !== DOCKING_CLEARANCE_STATE.GRANTED) {
        return undefined;
    }

    return createTargetedOfficerCommand({
        commandId: ENCOUNTER_OFFICER_COMMAND_ID.DOCK,
        label: 'DOCK',
        target: object,
    });
}
