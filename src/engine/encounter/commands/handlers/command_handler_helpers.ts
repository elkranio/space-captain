// src/engine/encounter/commands/handlers/command_handler_helpers.ts

import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../defs/player_location';
import {
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
    type EncounterOfficerCommandId,
    type ExecuteOfficerCommandInput,
} from '../../model/command';
import type { OfficerCommandExecutionContext } from '../../model/officer_command_handler';
import type { EncounterState } from '../../model/state';
import { ENCOUNTER_ANCHOR_KIND, type EncounterAnchorState } from '../../anchors/encounter_anchor';
import type { JumpPointEncounterAnchorState } from '../../anchors/jump_point/jump_point_encounter_anchor';
import type { StationEncounterAnchorState } from '../../anchors/station/station_encounter_anchor';

export function createUntargetedCommand(commandId: EncounterOfficerCommandId, label: string): AvailableOfficerCommand {
    return {
        commandId,
        label,

        target: {
            kind: OFFICER_COMMAND_TARGET_KIND.NONE,
        },
    };
}

export function createAnchorTargetedCommand(
    commandId: EncounterOfficerCommandId,
    label: string,
    anchor: EncounterAnchorState,
): AvailableOfficerCommand {
    return {
        commandId,
        label,

        target: {
            kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,
            anchorId: anchor.id,
        },

        targetLabel: anchor.displayName,
    };
}

export function isCurrentAnchor(state: EncounterState, anchor: EncounterAnchorState): boolean {
    const navigation = state.navigation;

    return navigation.kind === PLAYER_SPACE_NAVIGATION_KIND.ANCHORED && navigation.anchorId === anchor.id;
}

export function requireAnchorTargetId(input: ExecuteOfficerCommandInput): string {
    if (input.target.kind !== OFFICER_COMMAND_TARGET_KIND.ANCHOR) {
        throw new Error(`${input.commandId} command requires anchor target`);
    }

    return input.target.anchorId;
}

export function requireSpaceNodeTargetId(input: ExecuteOfficerCommandInput): string {
    if (input.target.kind !== OFFICER_COMMAND_TARGET_KIND.SPACE_NODE) {
        throw new Error(`${input.commandId} command requires space node target`);
    }

    return input.target.nodeId;
}

export function getStationTarget(
    context: OfficerCommandExecutionContext,
    input: ExecuteOfficerCommandInput,
): StationEncounterAnchorState {
    const anchorId = requireAnchorTargetId(input);
    const target = context.stateStore.findAnchorById(anchorId);

    if (!target) {
        throw new Error(`${input.commandId} command target not found: ${anchorId}`);
    }

    if (target.kind !== ENCOUNTER_ANCHOR_KIND.STATION) {
        throw new Error(`${input.commandId} command does not support encounter anchor: ${target.kind}`);
    }

    return target;
}

export function getJumpPointTarget(
    context: OfficerCommandExecutionContext,
    input: ExecuteOfficerCommandInput,
): JumpPointEncounterAnchorState {
    const anchorId = requireAnchorTargetId(input);
    const target = context.stateStore.findAnchorById(anchorId);

    if (!target) {
        throw new Error(`${input.commandId} command target not found: ${anchorId}`);
    }

    if (target.kind !== ENCOUNTER_ANCHOR_KIND.JUMP_POINT) {
        throw new Error(`${input.commandId} command does not support encounter anchor: ${target.kind}`);
    }

    return target;
}
