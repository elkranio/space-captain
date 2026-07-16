// src/engine/encounter/commands/queries/comms/hail/try_create_available_hail_command.ts

import { ENCOUNTER_OFFICER_COMMAND_ID, type AvailableOfficerCommand } from '../../../../model/command';
import type { EncounterObjectState } from '../../../../objects/encounter_object';
import { createTargetedOfficerCommand } from '../../shared/create_targeted_officer_command';

// Создаёт доступную HAIL-команду для объекта, который поддерживает hail.
// Проверка роли и наличие команды в object.officerCommands выполняются выше.
export function tryCreateAvailableHailCommand(object: EncounterObjectState): AvailableOfficerCommand {
    return createTargetedOfficerCommand({
        commandId: ENCOUNTER_OFFICER_COMMAND_ID.HAIL,
        label: 'HAIL',
        target: object,
    });
}
