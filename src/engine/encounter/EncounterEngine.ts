// src/engine/encounter/EncounterEngine.ts

import { PLAYER_SPACE_NAVIGATION_KIND, type PlayerSpaceNavigationState } from '../defs/player_location';
import OfficerCommandExecutor from './commands/OfficerCommandExecutor';
import { getAvailableOfficerCommands } from './commands/get_available_officer_commands';
import ContactSequenceRunner from './contact/ContactSequenceRunner';
import type { AvailableOfficerCommand, ExecuteOfficerCommandInput } from './model/command';
import { ENCOUNTER_EVENT, type EncounterEvent } from './model/event';
import type { OfficerAvailabilityStates } from './model/officer_availability';
import type { EncounterState } from './model/state';
import { getOfficerAvailabilityStates } from './officer_availability/queries/get_officer_availability_states';
import OfficerTaskRunner from './officer_tasks/OfficerTaskRunner';

export type EncounterEngineOptions = {
    state: EncounterState;

    completeTimedTasksImmediately?: boolean;
};

export default class EncounterEngine {
    private readonly state: EncounterState;

    private readonly events: EncounterEvent[] = [];

    private readonly officerTaskRunner: OfficerTaskRunner;

    private readonly contactSequenceRunner: ContactSequenceRunner;

    private readonly officerCommandExecutor: OfficerCommandExecutor;

    constructor({ state, completeTimedTasksImmediately = false }: EncounterEngineOptions) {
        this.state = state;

        this.officerTaskRunner = new OfficerTaskRunner({
            state: this.state,

            emit: this.emit,

            completeTimedTasksImmediately,
        });

        this.contactSequenceRunner = new ContactSequenceRunner({
            state: this.state,

            emit: this.emit,
        });

        this.officerCommandExecutor = new OfficerCommandExecutor({
            state: this.state,

            emit: this.emit,

            startOfficerTask: this.officerTaskRunner.start,

            completeOfficerTask: this.officerTaskRunner.complete,

            startContactSequence: this.contactSequenceRunner.start,
        });

        this.emit({
            type: ENCOUNTER_EVENT.ENCOUNTER_LOADED,

            state: this.state,
        });
    }

    // #region Public API

    public executeCommand(input: ExecuteOfficerCommandInput): void {
        this.officerCommandExecutor.execute(input);
    }

    public step(deltaMs: number): void {
        this.officerTaskRunner.step(deltaMs);

        this.contactSequenceRunner.step(deltaMs);
    }

    public completeArrival(): void {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ARRIVING) {
            throw new Error(`Cannot complete arrival from navigation state: ${navigation.kind}`);
        }

        this.state.navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorObjectId: navigation.targetObjectId,
        };
    }

    public completeTask(taskId: string): void {
        this.officerTaskRunner.complete(taskId);
    }

    public cancelTask(taskId: string): void {
        this.officerTaskRunner.cancel(taskId);
    }

    public getAvailableCommands(role: ExecuteOfficerCommandInput['role']): AvailableOfficerCommand[] {
        return getAvailableOfficerCommands(this.state, role);
    }

    public getNavigationState(): PlayerSpaceNavigationState {
        return {
            ...this.state.navigation,
        };
    }

    public getOfficerAvailabilityStates(): OfficerAvailabilityStates {
        return getOfficerAvailabilityStates(this.state);
    }

    public drainEvents(): EncounterEvent[] {
        const events = [...this.events];

        this.events.length = 0;

        return events;
    }

    // #endregion

    // #region Event outbox

    private emit = (event: EncounterEvent): void => {
        this.events.push(event);
    };

    // #endregion
}
