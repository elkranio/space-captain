// src/engine/encounter/commands/resolve_officer_commands.ts

import type { OfficerRole } from '../../defs/officer';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    type EncounterOfficerCommand,
    type EncounterOfficerCommandId,
} from '../encounter_command';
import type { EncounterState } from '../encounter_state';
import type { EncounterObjectState } from '../objects/encounter_object';

export function resolveOfficerCommands(state: EncounterState, role: OfficerRole): EncounterOfficerCommand[] {
    const commands: EncounterOfficerCommand[] = [];

    for (const object of state.objects) {
        for (const objectCommand of object.officerCommands) {
            if (objectCommand.role !== role) {
                continue;
            }

            commands.push({
                commandId: objectCommand.commandId,
                label: getCommandLabel(objectCommand.commandId, object),
                targetId: object.id,
                targetLabel: object.displayName,
            });
        }
    }

    return commands;
}

function getCommandLabel(commandId: EncounterOfficerCommandId, object: EncounterObjectState): string {
    switch (commandId) {
        case ENCOUNTER_OFFICER_COMMAND_ID.HAIL:
            return `Hail ${object.displayName}`;
    }

    throw new Error(`Unhandled encounter officer command: ${String(commandId)}`);
}
