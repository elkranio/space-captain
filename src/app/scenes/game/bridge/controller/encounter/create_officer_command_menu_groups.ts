// src/app/scenes/game/bridge/controller/encounter/create_officer_command_menu_groups.ts

import type { AvailableOfficerCommand } from '../../../../../../engine/encounter/model/command';
import type { BridgeOfficerCommandMenuGroupViewState } from '../../events/bridge_event';

export function createOfficerCommandMenuGroups(
    commands: AvailableOfficerCommand[],
): BridgeOfficerCommandMenuGroupViewState[] {
    const groups: BridgeOfficerCommandMenuGroupViewState[] = [];

    for (const command of commands) {
        const group = getOrCreateGroup(groups, command.targetLabel ?? 'GENERAL');

        group.items.push({
            commandId: command.commandId,
            label: command.label,
            targetId: command.targetId,
        });
    }

    return groups;
}

function getOrCreateGroup(
    groups: BridgeOfficerCommandMenuGroupViewState[],
    label: string,
): BridgeOfficerCommandMenuGroupViewState {
    const existingGroup = groups.find((group) => group.label === label);

    if (existingGroup) {
        return existingGroup;
    }

    const group = {
        label,
        items: [],
    };

    groups.push(group);

    return group;
}
