// src/engine/encounter/commands/queries/try_create_available_officer_command_for_object.ts

import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../defs/player_location';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    type AvailableOfficerCommand,
    type EncounterOfficerCommandId,
} from '../../model/command';
import type { EncounterState } from '../../model/state';
import {
    ENCOUNTER_OBJECT_KIND,
    type EncounterObjectOfficerCommand,
    type EncounterObjectState,
} from '../../objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from '../../objects/station/station_encounter_object';

// Создаёт доступную officer command
// для конкретного encounter object.
//
// Проверка роли и наличие command
// в object.officerCommands выполняются выше.
//
// FLY_TO доступна для других объектов encounter node.
// Все остальные object commands доступны только
// для текущего anchor object.
//
// Здесь также собраны небольшие command-specific
// правила доступности.
export function tryCreateAvailableOfficerCommandForObject(
    state: EncounterState,
    object: EncounterObjectState,
    objectCommand: EncounterObjectOfficerCommand,
): AvailableOfficerCommand | undefined {
    if (objectCommand.commandId !== ENCOUNTER_OFFICER_COMMAND_ID.FLY_TO && !isCurrentAnchorObject(state, object.id)) {
        return undefined;
    }

    switch (objectCommand.commandId) {
        case ENCOUNTER_OFFICER_COMMAND_ID.HAIL:
            return createTargetedCommand(ENCOUNTER_OFFICER_COMMAND_ID.HAIL, 'HAIL', object);

        case ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING:
            return tryCreateRequestDockingCommand(object);

        case ENCOUNTER_OFFICER_COMMAND_ID.DOCK:
            return tryCreateDockCommand(object);

        case ENCOUNTER_OFFICER_COMMAND_ID.FLY_TO:
            return tryCreateFlyToCommand(state, object);
    }

    throw new Error(`Unhandled encounter officer command: ${String(objectCommand.commandId)}`);
}

function isCurrentAnchorObject(state: EncounterState, objectId: string): boolean {
    const navigation = state.navigation;

    return navigation.kind === PLAYER_SPACE_NAVIGATION_KIND.ANCHORED && navigation.anchorObjectId === objectId;
}

function tryCreateRequestDockingCommand(object: EncounterObjectState): AvailableOfficerCommand | undefined {
    if (object.kind !== ENCOUNTER_OBJECT_KIND.STATION) {
        return undefined;
    }

    if (object.docking.clearance !== DOCKING_CLEARANCE_STATE.NONE) {
        return undefined;
    }

    return createTargetedCommand(ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING, 'REQUEST DOCKING', object);
}

function tryCreateDockCommand(object: EncounterObjectState): AvailableOfficerCommand | undefined {
    if (object.kind !== ENCOUNTER_OBJECT_KIND.STATION) {
        return undefined;
    }

    if (object.docking.clearance !== DOCKING_CLEARANCE_STATE.GRANTED) {
        return undefined;
    }

    return createTargetedCommand(ENCOUNTER_OFFICER_COMMAND_ID.DOCK, 'DOCK', object);
}

function tryCreateFlyToCommand(
    state: EncounterState,
    object: EncounterObjectState,
): AvailableOfficerCommand | undefined {
    const navigation = state.navigation;

    if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
        return undefined;
    }

    if (object.id === navigation.anchorObjectId) {
        return undefined;
    }

    return createTargetedCommand(ENCOUNTER_OFFICER_COMMAND_ID.FLY_TO, 'FLY TO', object);
}

function createTargetedCommand(
    commandId: EncounterOfficerCommandId,
    label: string,
    object: EncounterObjectState,
): AvailableOfficerCommand {
    return {
        commandId,
        label,
        targetId: object.id,
        targetLabel: object.displayName,
    };
}
