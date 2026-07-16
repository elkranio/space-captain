// src/engine/encounter/commands/execution/helm/dock/execute_dock_command.ts

import type { ExecuteOfficerCommandInput } from '../../../../model/command';
import { ENCOUNTER_EVENT } from '../../../../model/event';
import { ENCOUNTER_OBJECT_KIND } from '../../../../objects/encounter_object';
import { findEncounterObjectById } from '../../../../state/find_encounter_object_by_id';
import type { OfficerCommandExecutionContext } from '../../officer_command_execution_context';

// Выполняет HELM / DOCK для объекта, который уже прошёл проверку доступности.
// Команда только запускает docking flow; визуальную анимацию выполняет app-слой.
export function executeDockCommand(input: ExecuteOfficerCommandInput, context: OfficerCommandExecutionContext): void {
    const target = findEncounterObjectById(context.state, input.targetId);

    if (!target) {
        return;
    }

    switch (target.kind) {
        case ENCOUNTER_OBJECT_KIND.STATION:
            context.emit({
                type: ENCOUNTER_EVENT.DOCKING_STARTED,
                targetId: target.id,
            });
            return;
    }
}
