// src/app/scenes/game/bridge/controller/encounter/command_menu/BridgeOfficerCommandMenuController.ts

import type { OfficerRole } from "../../../../../../../engine/defs/officer";
import type { AvailableOfficerCommand } from "../../../../../../../engine/encounter/model/command";
import type { EncounterPresentationSnapshot } from "../../../../../../../engine/encounter/snapshots/encounter_presentation_snapshot";
import { BRIDGE_EVENT, type BridgeOfficerCommandMenuGroupPayload } from "../../../events/bridge_event";
import type BridgeEventBus from "../../../events/BridgeEventBus";

export default class BridgeOfficerCommandMenuController {
    constructor(private readonly eventBus: BridgeEventBus) {}

    // #region Public API

    public open(
        role: OfficerRole,

        snapshot: EncounterPresentationSnapshot,
    ): void {
        // Snapshot command availability is already domain-resolved.
        // Menu only groups presentation-safe commands for the selected role.
        const commands = snapshot.commandsByRole[role];

        this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED, {
            role,

            groups: this.createCommandGroups(commands),
        });
    }

    // #endregion

    // #region Command group creation

    private createCommandGroups(commands: AvailableOfficerCommand[]): BridgeOfficerCommandMenuGroupPayload[] {
        const groups: BridgeOfficerCommandMenuGroupPayload[] = [];

        for (const command of commands) {
            const group = this.getOrCreateGroup(groups, command.targetLabel ?? "GENERAL");

            group.items.push({
                kind: "command",

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
