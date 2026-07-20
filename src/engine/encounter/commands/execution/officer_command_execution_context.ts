// src/engine/encounter/commands/execution/officer_command_execution_context.ts
import type { ContactSequenceStep } from '../../contact/contact_sequence';
import type { EncounterEvent } from '../../model/event';
import type { OfficerTaskState } from '../../model/officer_task';
import type { EncounterState } from '../../model/state';

// Контекст, который command execution получает от EncounterEngine.
// Команды могут менять encounter state, отправлять события и запускать runtime flows,
// но не знают ничего про сам класс EncounterEngine.
export type OfficerCommandExecutionContext = {
    state: EncounterState;
    emit: (event: EncounterEvent) => void;
    startContactSequence: (steps: ContactSequenceStep[]) => void;
    startOfficerTask: (task: OfficerTaskState) => void;
};
