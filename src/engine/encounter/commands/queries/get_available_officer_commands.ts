// src/engine/encounter/commands/queries/get_available_officer_commands.ts

import type { OfficerRole } from '../../../defs/officer';
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

// Возвращает команды, которые выбранный офицер
// может предложить игроку прямо сейчас.
//
// Это чистый query по encounter state:
// без мутаций, событий и запуска command flow.
export function getAvailableOfficerCommands(state: EncounterState, role: OfficerRole): AvailableOfficerCommand[] {
    const commands: AvailableOfficerCommand[] = [];

    if (state.officerTasks[role]) {
        return [];
    }

    appendUntargetedCommands(state, commands, role);

    for (const object of state.objects) {
        for (const commandId of object.officerCommandIds) {
            const commandDef = getOfficerCommandDef(commandId);

            if (commandDef.role !== role) {
                continue;
            }

            const command = tryCreateAvailableOfficerCommandForObject(state, object, commandId);

            if (command) {
                commands.push(command);
            }
        }
    }

    return commands;
}

function appendUntargetedCommands(state: EncounterState, commands: AvailableOfficerCommand[], role: OfficerRole): void {
    const commandIds: EncounterOfficerCommandId[] = Object.values(ENCOUNTER_OFFICER_COMMAND_ID);

    for (const commandId of commandIds) {
        const commandDef = getOfficerCommandDef(commandId);

        if (commandDef.role !== role) {
            continue;
        }

        if (commandDef.targeting.kind !== OFFICER_COMMAND_TARGET_KIND.NONE) {
            continue;
        }

        // Первый vertical slice поддерживает только одну
        // рассчитанную jump solution одновременно.
        if (
            commandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE &&
            state.objects.some((object) => object.kind === ENCOUNTER_OBJECT_KIND.JUMP_POINT)
        ) {
            continue;
        }

        commands.push({
            commandId,
            label: commandDef.label,
        });
    }
}

function tryCreateAvailableOfficerCommandForObject(
    state: EncounterState,
    object: EncounterObjectState,
    commandId: EncounterOfficerCommandId,
): AvailableOfficerCommand | undefined {
    const commandDef = getOfficerCommandDef(commandId);

    if (commandDef.targeting.kind !== OFFICER_COMMAND_TARGET_KIND.ENCOUNTER_OBJECT) {
        throw new Error(`Encounter object contains untargeted officer command: ${commandId}`);
    }

    if (
        commandDef.targeting.scope === ENCOUNTER_OBJECT_TARGET_SCOPE.CURRENT_ANCHOR &&
        !isCurrentAnchorObject(state, object.id)
    ) {
        return undefined;
    }

    switch (commandId) {
        case ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL:
            return createTargetedCommand(commandId, commandDef.label, object);

        case ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING:
            return tryCreateRequestDockingCommand(commandId, commandDef.label, object);

        case ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK:
            return tryCreateDockCommand(commandId, commandDef.label, object);

        case ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO:
            return tryCreateFlyToCommand(state, commandId, commandDef.label, object);
    }

    throw new Error(`Unhandled encounter object officer command: ${String(commandId)}`);
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
