// src/app/scenes/game/bridge/controller/encounter/command_menu/BridgeOfficerCommandMenuController.ts

import type { OfficerRole } from '../../../../../../../engine/defs/officer';
import type EncounterEngine from '../../../../../../../engine/encounter/EncounterEngine';
import type { AvailableOfficerCommand } from '../../../../../../../engine/encounter/model/command';
import {
    BRIDGE_EVENT,
    type BridgeOfficerCommandMenuGroupPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';

export default class BridgeOfficerCommandMenuController {
    constructor(
        private readonly encounterEngine: EncounterEngine,
        private readonly eventBus: BridgeEventBus,
    ) {}

    // #region Public API

    public open(role: OfficerRole): void {
        // Engine command availability already returns []
        // for a role with an active officer task.
        // Menu must not duplicate that domain rule.
        const commands =
            this.encounterEngine
                .getAvailableCommands(
                    role,
                );

        this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED, {
            role,

            groups:
                this.createCommandGroups(
                    commands,
                ),
        });
    }

    // #endregion

    // #region Command group creation

    private createCommandGroups(
        commands: AvailableOfficerCommand[],
    ): BridgeOfficerCommandMenuGroupPayload[] {
        const groups: BridgeOfficerCommandMenuGroupPayload[] = [];

        for (const command of commands) {
            const group = this.getOrCreateGroup(
                groups,
                command.targetLabel ?? 'GENERAL',
            );

            group.items.push({
                kind: 'command',

                commandId: command.commandId,
                label: command.label,

                target: {
                    ...command.target,
                },
            });
        }

        return groups;
    }

    private getOrCreateGroup(
        groups: BridgeOfficerCommandMenuGroupPayload[],
        label: string,
    ): BridgeOfficerCommandMenuGroupPayload {
        const existingGroup = groups.find((group) => {
            return group.label === label;
        });

        if (existingGroup) {
            return existingGroup;
        }

        const group: BridgeOfficerCommandMenuGroupPayload = {
            label,
            items: [],
        };

        groups.push(group);

        return group;
    }

    // #endregion
}
