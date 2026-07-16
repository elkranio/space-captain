// src/engine/encounter/commands/queries/shared/create_targeted_officer_command.ts

import type { AvailableOfficerCommand, EncounterOfficerCommandId } from '../../../model/command';
import type { EncounterObjectState } from '../../../objects/encounter_object';

// Собирает доступную команду, привязанную к конкретному encounter object.
// Командные файлы решают "доступно или нет", а этот helper только нормализует shape.
export function createTargetedOfficerCommand(input: {
    commandId: EncounterOfficerCommandId;
    label: string;
    target: EncounterObjectState;
}): AvailableOfficerCommand {
    return {
        commandId: input.commandId,
        label: input.label,
        targetId: input.target.id,
        targetLabel: input.target.displayName,
    };
}
