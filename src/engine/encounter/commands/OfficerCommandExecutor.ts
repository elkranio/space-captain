// src/engine/encounter/commands/OfficerCommandExecutor.ts
import type { ContactSequenceStep } from '../contact/contact_sequence';
import { createStationHailSequence } from '../contact/sequences/create_station_hail_sequence';
import { ENCOUNTER_OFFICER_COMMAND_ID, type ExecuteOfficerCommandInput } from '../model/command';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../model/event';
import type { OfficerTaskState } from '../model/officer_task';
import type { EncounterState } from '../model/state';
import { ENCOUNTER_OBJECT_KIND } from '../objects/encounter_object';
import { createCommsRequestDockingTask } from '../officer_tasks/factories/create_comms_request_docking_task';
import { findEncounterObjectById } from '../state/find_encounter_object_by_id';
import { getAvailableOfficerCommands } from './get_available_officer_commands';

type OfficerCommandExecutorOptions = {
    state: EncounterState;
    emit: (event: EncounterEvent) => void;
    startOfficerTask: (task: OfficerTaskState) => void;
    startContactSequence: (steps: ContactSequenceStep[]) => void;
};

export default class OfficerCommandExecutor {
    private readonly state: EncounterState;
    private readonly emit: (event: EncounterEvent) => void;
    private readonly startOfficerTask: (task: OfficerTaskState) => void;
    private readonly startContactSequence: (steps: ContactSequenceStep[]) => void;

    constructor({ state, emit, startOfficerTask, startContactSequence }: OfficerCommandExecutorOptions) {
        this.state = state;
        this.emit = emit;
        this.startOfficerTask = startOfficerTask;
        this.startContactSequence = startContactSequence;
    }

    public execute(input: ExecuteOfficerCommandInput): void {
        if (!this.canExecute(input)) {
            return;
        }

        switch (input.commandId) {
            case ENCOUNTER_OFFICER_COMMAND_ID.HAIL:
                this.executeHail(input);
                return;

            case ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING:
                this.executeRequestDocking(input);
                return;

            case ENCOUNTER_OFFICER_COMMAND_ID.DOCK:
                this.executeDock(input);
                return;

            default:
                throw new Error(`Unhandled encounter officer command: ${String(input.commandId)}`);
        }
    }

    private canExecute(input: ExecuteOfficerCommandInput): boolean {
        const commands = getAvailableOfficerCommands(this.state, input.role);

        return commands.some((command) => {
            return command.commandId === input.commandId && command.targetId === input.targetId;
        });
    }

    private executeHail(input: ExecuteOfficerCommandInput): void {
        const target = findEncounterObjectById(this.state, input.targetId);

        if (!target) {
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                this.startContactSequence(createStationHailSequence(target));
                return;
        }
    }

    private executeRequestDocking(input: ExecuteOfficerCommandInput): void {
        if (!input.targetId) {
            throw new Error('REQUEST_DOCKING command requires targetId');
        }

        this.startOfficerTask(createCommsRequestDockingTask(input.targetId));
    }

    private executeDock(input: ExecuteOfficerCommandInput): void {
        const target = findEncounterObjectById(this.state, input.targetId);

        if (!target) {
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                this.emit({
                    type: ENCOUNTER_EVENT.DOCKING_STARTED,
                    targetId: target.id,
                });
                return;
        }
    }
}
