// src/engine/encounter/commands/execution/execute_officer_command_for_object.ts

import { ENCOUNTER_OFFICER_COMMAND_ID, type ExecuteOfficerCommandInput } from '../../model/command';
import { executeHailCommand } from './comms/hail/execute_hail_command';
import { executeRequestDockingCommand } from './comms/request_docking/execute_request_docking_command';
import { executeDockCommand } from './helm/dock/execute_dock_command';
import type { OfficerCommandExecutionContext } from './officer_command_execution_context';

// Выбирает command-specific execution по id команды.
// Валидация доступности команды выполняется выше, а детали выполнения живут в файлах конкретных команд.
export function executeOfficerCommandForObject(
    input: ExecuteOfficerCommandInput,
    context: OfficerCommandExecutionContext,
): void {
    switch (input.commandId) {
        case ENCOUNTER_OFFICER_COMMAND_ID.HAIL:
            executeHailCommand(input, context);
            return;

        case ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING:
            executeRequestDockingCommand(input, context);
            return;

        case ENCOUNTER_OFFICER_COMMAND_ID.DOCK:
            executeDockCommand(input, context);
            return;
    }

    throw new Error(`Unhandled encounter officer command: ${String(input.commandId)}`);
}
