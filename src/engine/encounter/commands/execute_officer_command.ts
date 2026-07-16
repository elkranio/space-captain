// src/engine/encounter/commands/execute_officer_command.ts

import type { ExecuteOfficerCommandInput } from '../model/command';
import { executeOfficerCommandForObject } from './execution/execute_officer_command_for_object';
import type { OfficerCommandExecutionContext } from './execution/officer_command_execution_context';
import { getAvailableOfficerCommands } from './get_available_officer_commands';

// Выполняет officer command только если она доступна в текущем encounter state.
// Это public entry execution-слоя: validation здесь, детали выполнения — в command-specific файлах.
export function executeOfficerCommand(
    input: ExecuteOfficerCommandInput,
    context: OfficerCommandExecutionContext,
): void {
    if (!canExecuteOfficerCommand(input, context)) {
        return;
    }

    executeOfficerCommandForObject(input, context);
}

function canExecuteOfficerCommand(input: ExecuteOfficerCommandInput, context: OfficerCommandExecutionContext): boolean {
    const commands = getAvailableOfficerCommands(context.state, input.role);

    return commands.some((command) => {
        return command.commandId === input.commandId && command.targetId === input.targetId;
    });
}
