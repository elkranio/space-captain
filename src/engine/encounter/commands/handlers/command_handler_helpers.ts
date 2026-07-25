// src/engine/encounter/commands/handlers/command_handler_helpers.ts

import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../defs/player_location';
import type {
    AvailableOfficerCommand,
    EncounterOfficerCommandId,
    ExecuteOfficerCommandInput,
} from '../../model/command';
import type { OfficerCommandExecutionContext } from '../../model/officer_command_handler';
import type { EncounterState } from '../../model/state';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectState } from '../../objects/encounter_object';
import type { JumpPointEncounterObjectState } from '../../objects/jump_point/jump_point_encounter_object';
import type { StationEncounterObjectState } from '../../objects/station/station_encounter_object';

export function createTargetedCommand(
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

export function isCurrentAnchorObject(state: EncounterState, object: EncounterObjectState): boolean {
    const navigation = state.navigation;

    return navigation.kind === PLAYER_SPACE_NAVIGATION_KIND.ANCHORED && navigation.anchorObjectId === object.id;
}

export function requireTargetId(input: ExecuteOfficerCommandInput): string {
    if (!input.targetId) {
        throw new Error(`${input.commandId} command requires targetId`);
    }

    return input.targetId;
}

export function requireTargetNodeId(input: ExecuteOfficerCommandInput): string {
    if (!input.targetNodeId) {
        throw new Error(`${input.commandId} command requires targetNodeId`);
    }

    return input.targetNodeId;
}

export function getStationTarget(
    context: OfficerCommandExecutionContext,
    input: ExecuteOfficerCommandInput,
): StationEncounterObjectState {
    const targetId = requireTargetId(input);
    const target = context.stateStore.findAnchorById(targetId);

    if (!target) {
        throw new Error(`${input.commandId} command target not found: ${targetId}`);
    }

    if (target.kind !== ENCOUNTER_OBJECT_KIND.STATION) {
        throw new Error(`${input.commandId} command does not support encounter object: ${target.kind}`);
    }

    return target;
}

export function getJumpPointTarget(
    context: OfficerCommandExecutionContext,
    input: ExecuteOfficerCommandInput,
): JumpPointEncounterObjectState {
    const targetId = requireTargetId(input);
    const target = context.stateStore.findAnchorById(targetId);

    if (!target) {
        throw new Error(`${input.commandId} command target not found: ${targetId}`);
    }

    if (target.kind !== ENCOUNTER_OBJECT_KIND.JUMP_POINT) {
        throw new Error(`${input.commandId} command does not support encounter object: ${target.kind}`);
    }

    return target;
}
