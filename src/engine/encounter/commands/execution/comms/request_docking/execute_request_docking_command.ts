// src/engine/encounter/commands/execution/comms/request_docking/execute_request_docking_command.ts
import type { ExecuteOfficerCommandInput } from '../../../../model/command';
import { createCommsRequestDockingTask } from '../../../../officer_tasks/factories/create_comms_request_docking_task';
import type { OfficerCommandExecutionContext } from '../../officer_command_execution_context';

// Запускает Comms task запроса docking clearance.
// Сам результат применится позже, когда task завершится.
export function executeRequestDockingCommand(
    command: ExecuteOfficerCommandInput,
    context: OfficerCommandExecutionContext,
): void {
    if (!command.targetId) {
        throw new Error('REQUEST_DOCKING command requires targetId');
    }

    context.startOfficerTask(createCommsRequestDockingTask(command.targetId));
}
