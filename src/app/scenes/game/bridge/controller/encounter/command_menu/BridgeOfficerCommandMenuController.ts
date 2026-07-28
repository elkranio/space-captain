// src/app/scenes/game/bridge/controller/encounter/command_menu/BridgeOfficerCommandMenuController.ts

import type { OfficerRole } from '../../../../../../../engine/defs/officer';
import type EncounterEngine from '../../../../../../../engine/encounter/EncounterEngine';
import {
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
    type OfficerCommandTarget,
} from '../../../../../../../engine/encounter/model/command';
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

                targetId: this.getTargetId(command.target),
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

    private getTargetId(target: OfficerCommandTarget): string | undefined {
        switch (target.kind) {
            case OFFICER_COMMAND_TARGET_KIND.NONE:
                return undefined;

            case OFFICER_COMMAND_TARGET_KIND.ANCHOR:
                return target.anchorId;

            case OFFICER_COMMAND_TARGET_KIND.ACTOR:
                return target.actorId;

            case OFFICER_COMMAND_TARGET_KIND.SPACE_NODE:
                return target.nodeId;

            case OFFICER_COMMAND_TARGET_KIND.THREAT:
                return target.threatId;

            default:
                return this.assertNever(target);
        }
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled officer command target: ${String(value)}`);
    }

    // #endregion
}
