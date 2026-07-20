// src/engine/encounter/commands/execution/comms/request_docking/execute_request_docking_command.ts

import type { ExecuteOfficerCommandInput } from '../../../../model/command';
import { ENCOUNTER_EVENT } from '../../../../model/event';
import { createCommsRequestDockingTask } from '../../../../officer_tasks/factories/create_comms_request_docking_task';
import { setOfficerTask } from '../../../../officer_tasks/set_officer_task';
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

    const task = createCommsRequestDockingTask(command.targetId);

    setOfficerTask(context.state, task);

    context.emit({
        type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,
        role: task.role,
        taskId: task.id,
        label: task.label,
    });
}
