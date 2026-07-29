// src/app/scenes/game/bridge/controller/encounter/command_menu/BridgeOfficerCommandMenuController.ts

import type { OfficerRole } from '../../../../../../../engine/defs/officer';
import type EncounterEngine from '../../../../../../../engine/encounter/EncounterEngine';
import type { AvailableOfficerCommand } from '../../../../../../../engine/encounter/model/command';
import { BRIDGE_EVENT, type BridgeOfficerCommandMenuGroupPayload } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';

export default class BridgeOfficerCommandMenuController {
    constructor(
        private readonly encounterEngine: EncounterEngine,
        private readonly eventBus: BridgeEventBus,
    ) {}

    // #region Public API

    public open(role: OfficerRole): void {
        const commands = this.encounterEngine.getAvailableCommands(role);

        this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED, {
            role,
            groups: this.createGroups(commands),
        });
    }

    // #endregion

    // #region Group creation

    private createGroups(commands: AvailableOfficerCommand[]): BridgeOfficerCommandMenuGroupPayload[] {
        const groups: BridgeOfficerCommandMenuGroupPayload[] = [];

        for (const command of commands) {
            const group = this.getOrCreateGroup(groups, command.targetLabel ?? 'GENERAL');

            group.items.push({
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
