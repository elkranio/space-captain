// src/app/scenes/game/bridge/controller/encounter/command_menu/BridgeOfficerCommandMenuController.ts

import type { OfficerRole } from '../../../../../../../engine/defs/officer';
import type EncounterEngine from '../../../../../../../engine/encounter/EncounterEngine';
import type { AvailableOfficerCommand } from '../../../../../../../engine/encounter/model/command';
import type { OfficerTaskState } from '../../../../../../../engine/encounter/model/officer_task';
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
        const activeTask = this.findTaskByRole(role);

        this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED, {
            role,

            // Busy officer tasks are presented directly on the station.
            // Legacy context menu no longer owns task cancellation.
            groups: activeTask
                ? []
                : this.createCommandGroups(
                      this.encounterEngine.getAvailableCommands(role),
                  ),
        });
    }

    // #endregion

    // #region Active task state

    private findTaskByRole(role: OfficerRole): OfficerTaskState | undefined {
        return this.encounterEngine.getOfficerTasks().find((task) => {
            return task.role === role;
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
