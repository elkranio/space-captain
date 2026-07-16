// src/engine/encounter/commands/execution/officer_command_execution_context.ts

import type { ContactSequenceStep } from '../../contact/contact_sequence';
import type { EncounterEvent } from '../../model/event';
import type { EncounterState } from '../../model/state';

// Контекст, который command execution получает от EncounterEngine.
// Команды могут менять encounter state, отправлять события и запускать contact sequences,
// но не знают ничего про сам класс EncounterEngine.
export type OfficerCommandExecutionContext = {
    state: EncounterState;
    emit: (event: EncounterEvent) => void;
    startContactSequence: (steps: ContactSequenceStep[]) => void;
};
