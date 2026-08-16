// src/engine/encounter/model/officer_command_handler.ts

import type EncounterStateStore from '../state/EncounterStateStore';
import type {
    AvailableOfficerCommand,
    EncounterOfficerCommandId,
    ExecuteOfficerCommandInput,
    OfficerCommandDef,
} from './command';
import type { EncounterEvent } from './event';
import type { OfficerTaskDraft } from './officer_task';
import type { EncounterState } from './state';

export type OfficerCommandExecutionContext = {
    stateStore: EncounterStateStore;

    emit: (event: EncounterEvent) => void;

    startOfficerTask: (task: OfficerTaskDraft) => string;
};

export type OfficerCommandHandler = {
    commandId: EncounterOfficerCommandId;
    def: OfficerCommandDef;

    getAvailableCommands(
        state: EncounterState,
    ): AvailableOfficerCommand[];

    execute(context: OfficerCommandExecutionContext, input: ExecuteOfficerCommandInput): void;
};
