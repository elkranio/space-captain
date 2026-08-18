// src/engine/encounter/commands/queries/get_available_officer_commands.ts

import type { OfficerRole } from "../../../defs/officer";
import { SHIP_DRIVE_STATUS } from "../../../defs/ship_drive";
import type { AvailableOfficerCommand } from "../../model/command";
import type { EncounterState } from "../../model/state";
import { OFFICER_COMMAND_HANDLERS } from "../officer_command_handlers";

// Возвращает команды, которые выбранный офицер
// может предложить игроку прямо сейчас.
//
// Это чистый query по encounter state:
// без мутаций, событий и запуска command flow.
export function getAvailableOfficerCommands(state: EncounterState, role: OfficerRole): AvailableOfficerCommand[] {
    if (state.officerTasks[role]) {
        return [];
    }

    const commands: AvailableOfficerCommand[] = [];

    for (const handler of OFFICER_COMMAND_HANDLERS) {
        if (handler.def.role !== role) {
            continue;
        }

        if (handler.def.requiresOnlineDrive && state.drive.status !== SHIP_DRIVE_STATUS.ONLINE) {
            continue;
        }

        commands.push(...handler.getAvailableCommands(state));
    }

    return commands;
}
