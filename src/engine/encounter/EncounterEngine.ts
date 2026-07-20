// src/engine/encounter/EncounterEngine.ts
import OfficerCommandExecutor from './commands/OfficerCommandExecutor';
import { getAvailableOfficerCommands } from './commands/get_available_officer_commands';
import ContactSequenceRunner from './contact/ContactSequenceRunner';
import type { ExecuteOfficerCommandInput } from './model/command';
import { ENCOUNTER_EVENT, type EncounterEvent } from './model/event';
import type { OfficerAvailabilityStates } from './model/officer_availability';
import type { EncounterState } from './model/state';
import { getOfficerAvailabilityStates } from './officer_availability/queries/get_officer_availability_states';
import OfficerTaskRunner from './officer_tasks/OfficerTaskRunner';
import { createInitialEncounterState } from './state/create_initial_encounter_state';

export default class EncounterEngine {
    private readonly state: EncounterState;
    private readonly events: EncounterEvent[] = [];

    private readonly officerTaskRunner: OfficerTaskRunner;
    private readonly contactSequenceRunner: ContactSequenceRunner;
    private readonly officerCommandExecutor: OfficerCommandExecutor;

    constructor(state: EncounterState = createInitialEncounterState()) {
        this.state = state;

        this.officerTaskRunner = new OfficerTaskRunner({
            state: this.state,
            emit: this.emit,
        });

        this.contactSequenceRunner = new ContactSequenceRunner({
            state: this.state,
            emit: this.emit,
        });

        this.officerCommandExecutor = new OfficerCommandExecutor({
            state: this.state,
            emit: this.emit,
            startOfficerTask: this.officerTaskRunner.start,
            endOfficerTask: this.officerTaskRunner.end,
            startContactSequence: this.contactSequenceRunner.start,
        });

        this.emit({
            type: ENCOUNTER_EVENT.ENCOUNTER_LOADED,
            state: this.state,
        });
    }

    public step(deltaMs: number): void {
        this.officerTaskRunner.step(deltaMs);
        this.contactSequenceRunner.step(deltaMs);
    }

    public executeOfficerCommand(input: ExecuteOfficerCommandInput): void {
        this.officerCommandExecutor.execute(input);
    }

    public requestOfficerCommands(role: ExecuteOfficerCommandInput['role']): void {
        this.emit({
            type: ENCOUNTER_EVENT.AVAILABLE_OFFICER_COMMANDS_UPDATED,
            role,
            commands: getAvailableOfficerCommands(this.state, role),
        });
    }

    public getOfficerAvailabilityStates(): OfficerAvailabilityStates {
        return getOfficerAvailabilityStates(this.state);
    }

    public drainEvents(): EncounterEvent[] {
        const events = [...this.events];
        this.events.length = 0;

        return events;
    }

    private emit = (event: EncounterEvent): void => {
        this.events.push(event);
    };
}
