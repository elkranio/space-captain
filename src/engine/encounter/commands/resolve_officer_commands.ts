// src/engine/encounter/commands/resolve_officer_commands.ts
import type { OfficerRole } from '../../defs/officer';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    type AvailableOfficerCommand,
    type EncounterOfficerCommandId,
} from '../model/command';
import type { EncounterState } from '../encounter_state';
import {
    ENCOUNTER_OBJECT_KIND,
    type EncounterObjectOfficerCommand,
    type EncounterObjectState,
} from '../objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from '../objects/station/station_encounter_object';

export function resolveOfficerCommands(state: EncounterState, role: OfficerRole): AvailableOfficerCommand[] {
    const commands: AvailableOfficerCommand[] = [];

    for (const object of state.objects) {
        for (const objectCommand of object.officerCommands) {
            if (objectCommand.role !== role) {
                continue;
            }

            if (!canResolveObjectCommand(object, objectCommand)) {
                continue;
            }

            commands.push({
                commandId: objectCommand.commandId,
                label: getCommandLabel(objectCommand.commandId),
                targetId: object.id,
                targetLabel: object.displayName,
            });
        }
    }

    return commands;
}

function canResolveObjectCommand(object: EncounterObjectState, objectCommand: EncounterObjectOfficerCommand): boolean {
    switch (objectCommand.commandId) {
        case ENCOUNTER_OFFICER_COMMAND_ID.HAIL:
            return true;

        case ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING:
            return canRequestDocking(object);

        case ENCOUNTER_OFFICER_COMMAND_ID.DOCK:
            return canDock(object);
    }

    throw new Error(`Unhandled encounter officer command: ${String(objectCommand.commandId)}`);
}

function canRequestDocking(object: EncounterObjectState): boolean {
    switch (object.kind) {
        case ENCOUNTER_OBJECT_KIND.STATION:
            return object.docking.clearance === DOCKING_CLEARANCE_STATE.NONE;
    }
}

function canDock(object: EncounterObjectState): boolean {
    switch (object.kind) {
        case ENCOUNTER_OBJECT_KIND.STATION:
            return object.docking.clearance === DOCKING_CLEARANCE_STATE.GRANTED;
    }
}

function getCommandLabel(commandId: EncounterOfficerCommandId): string {
    switch (commandId) {
        case ENCOUNTER_OFFICER_COMMAND_ID.HAIL:
            return 'HAIL';

        case ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING:
            return 'REQUEST DOCKING';

        case ENCOUNTER_OFFICER_COMMAND_ID.DOCK:
            return 'DOCK';
    }

    throw new Error(`Unhandled encounter officer command: ${String(commandId)}`);
}
