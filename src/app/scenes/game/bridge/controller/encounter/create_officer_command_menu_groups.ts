// src/app/scenes/game/bridge/controller/encounter/create_officer_command_menu_groups.ts

import type { AvailableOfficerCommand } from '../../../../../../engine/encounter/model/command';
import { BridgeOfficerCommandMenuGroupPayload } from '../../events/bridge_event';

export function createOfficerCommandMenuGroups(
    commands: AvailableOfficerCommand[],
): BridgeOfficerCommandMenuGroupPayload[] {
    const groups: BridgeOfficerCommandMenuGroupPayload[] = [];

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
    groups: BridgeOfficerCommandMenuGroupPayload[],
    label: string,
): BridgeOfficerCommandMenuGroupPayload {
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
