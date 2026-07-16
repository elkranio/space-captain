// src/engine/encounter/commands/get_available_officer_commands.ts

import type { OfficerRole } from '../../defs/officer';
import type { AvailableOfficerCommand } from '../model/command';
import type { EncounterState } from '../model/state';
import { tryCreateAvailableOfficerCommandForObject } from './queries/try_create_available_officer_command_for_object';

// Возвращает команды, которые выбранный офицер может предложить игроку прямо сейчас.
// Это чистый query по encounter state: без мутаций, событий и запуска command flow.
export function getAvailableOfficerCommands(state: EncounterState, role: OfficerRole): AvailableOfficerCommand[] {
    const commands: AvailableOfficerCommand[] = [];

    for (const object of state.objects) {
        for (const objectCommand of object.officerCommands) {
            if (objectCommand.role !== role) {
                continue;
            }

            const command = tryCreateAvailableOfficerCommandForObject(object, objectCommand);

            if (command) {
                commands.push(command);
            }
        }
    }

    return commands;
}
