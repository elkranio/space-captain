// src/engine/encounter/EncounterEngine.ts

import type { OfficerRole } from '../defs/officer';
import { resolveOfficerCommands } from './commands/resolve_officer_commands';
import { ENCOUNTER_EVENT, type EncounterEvent } from './encounter_event';
import type { EncounterState } from './encounter_state';
import { createInitialEncounterState } from './state/create_initial_encounter_state';
import { ENCOUNTER_OFFICER_COMMAND_ID, type ExecuteOfficerCommandInput } from './encounter_command';

export default class EncounterEngine {
    private readonly state: EncounterState;
    private readonly outbox: EncounterEvent[] = [];

    constructor() {
        this.state = createInitialEncounterState();

        this.outbox.push({
            type: ENCOUNTER_EVENT.ENCOUNTER_LOADED,
            state: this.state,
        });
    }

    public drainEvents(): EncounterEvent[] {
        const events = [...this.outbox];

        this.outbox.length = 0;

        return events;
    }

    public requestOfficerCommands(role: OfficerRole): void {
        this.outbox.push({
            type: ENCOUNTER_EVENT.OFFICER_COMMANDS_READY,
            role,
            commands: resolveOfficerCommands(this.state, role),
        });
    }

    public executeOfficerCommand(input: ExecuteOfficerCommandInput): void {
        if (!this.canExecuteOfficerCommand(input)) {
            console.warn('Cannot execute officer command:', input);
            return;
        }

        switch (input.commandId) {
            case ENCOUNTER_OFFICER_COMMAND_ID.HAIL:
                console.log('Execute HAIL command:', input);
                return;

            case ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING:
                console.log('Execute REQUEST_DOCKING command:', input);
                return;
        }

        console.warn('Unhandled officer command:', input);
    }

    private canExecuteOfficerCommand(input: ExecuteOfficerCommandInput): boolean {
        const commands = resolveOfficerCommands(this.state, input.role);

        return commands.some((command) => {
            if (command.commandId !== input.commandId) {
                return false;
            }

            return command.targetId === input.targetId;
        });
    }
}
