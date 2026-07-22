// src/engine/encounter/commands/queries/try_create_available_officer_command_for_object.ts

import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../defs/player_location';
import {
    ENCOUNTER_OBJECT_TARGET_SCOPE,
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    getOfficerCommandDef,
    type AvailableOfficerCommand,
    type EncounterOfficerCommandId,
} from '../../model/command';
import type { EncounterState } from '../../model/state';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectState } from '../../objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from '../../objects/station/station_encounter_object';

// Создаёт доступную officer command
// для конкретного encounter object.
//
// Статические свойства команды:
// - label;
// - target kind;
// - encounter object scope;
//
// берутся из command def.
//
// Command-specific проверки по текущему EncounterState
// остаются в этом query.
export function tryCreateAvailableOfficerCommandForObject(
    state: EncounterState,
    object: EncounterObjectState,
    commandId: EncounterOfficerCommandId,
): AvailableOfficerCommand | undefined {
    const commandDef = getOfficerCommandDef(commandId);
    const targeting = commandDef.targeting;

    if (targeting.kind !== OFFICER_COMMAND_TARGET_KIND.ENCOUNTER_OBJECT) {
        throw new Error(
            `Officer command "${commandId}" is assigned to encounter object ` + `but targets "${targeting.kind}"`,
        );
    }

    if (targeting.scope === ENCOUNTER_OBJECT_TARGET_SCOPE.CURRENT_ANCHOR && !isCurrentAnchorObject(state, object.id)) {
        return undefined;
    }

    switch (commandId) {
        case ENCOUNTER_OFFICER_COMMAND_ID.HAIL:
            return createTargetedCommand(commandId, commandDef.label, object);

        case ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING:
            return tryCreateRequestDockingCommand(commandId, commandDef.label, object);

        case ENCOUNTER_OFFICER_COMMAND_ID.DOCK:
            return tryCreateDockCommand(commandId, commandDef.label, object);

        case ENCOUNTER_OFFICER_COMMAND_ID.FLY_TO:
            return tryCreateFlyToCommand(state, commandId, commandDef.label, object);
    }

    throw new Error(`Unhandled encounter officer command: ${String(commandId)}`);
}

function isCurrentAnchorObject(state: EncounterState, objectId: string): boolean {
    const navigation = state.navigation;

    return navigation.kind === PLAYER_SPACE_NAVIGATION_KIND.ANCHORED && navigation.anchorObjectId === objectId;
}

function tryCreateRequestDockingCommand(
    commandId: EncounterOfficerCommandId,
    label: string,
    object: EncounterObjectState,
): AvailableOfficerCommand | undefined {
    if (object.kind !== ENCOUNTER_OBJECT_KIND.STATION) {
        return undefined;
    }

    if (object.docking.clearance !== DOCKING_CLEARANCE_STATE.NONE) {
        return undefined;
    }

    return createTargetedCommand(commandId, label, object);
}

function tryCreateDockCommand(
    commandId: EncounterOfficerCommandId,
    label: string,
    object: EncounterObjectState,
): AvailableOfficerCommand | undefined {
    if (object.kind !== ENCOUNTER_OBJECT_KIND.STATION) {
        return undefined;
    }

    if (object.docking.clearance !== DOCKING_CLEARANCE_STATE.GRANTED) {
        return undefined;
    }

    return createTargetedCommand(commandId, label, object);
}

function tryCreateFlyToCommand(
    state: EncounterState,
    commandId: EncounterOfficerCommandId,
    label: string,
    object: EncounterObjectState,
): AvailableOfficerCommand | undefined {
    const navigation = state.navigation;

    if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
        return undefined;
    }

    if (object.id === navigation.anchorObjectId) {
        return undefined;
    }

    return createTargetedCommand(commandId, label, object);
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
