// src/engine/encounter/EncounterEngine.ts

import type { PlayerSpaceNavigationState } from '../defs/player_location';
import type { SpaceNodeState } from '../defs/universe';
import OfficerCommandExecutor from './commands/OfficerCommandExecutor';
import { getAvailableOfficerCommands } from './commands/get_available_officer_commands';
import ContactSequenceRunner from './contact/ContactSequenceRunner';
import type { AvailableOfficerCommand, ExecuteOfficerCommandInput, ExecuteOfficerCommandResult } from './model/command';
import { ENCOUNTER_EVENT, type EncounterEvent } from './model/event';
import type { OfficerAvailabilityStates } from './model/officer_availability';
import { getOfficerAvailabilityStates } from './officer_availability/queries/get_officer_availability_states';
import OfficerTaskRunner from './officer_tasks/OfficerTaskRunner';
import EncounterStateStore from './state/EncounterStateStore';

export type EncounterEngineOptions = {
    node: SpaceNodeState;
    navigation: PlayerSpaceNavigationState;
    completeTimedTasksImmediately?: boolean;
};

export default class EncounterEngine {
    private readonly stateStore: EncounterStateStore;

    private readonly events: EncounterEvent[] = [];

    private readonly officerTaskRunner: OfficerTaskRunner;

    private readonly contactSequenceRunner: ContactSequenceRunner;

    private readonly officerCommandExecutor: OfficerCommandExecutor;

    constructor({ node, navigation, completeTimedTasksImmediately = false }: EncounterEngineOptions) {
        this.stateStore = EncounterStateStore.fromSpaceNode(node, navigation);

        const encounterState = this.stateStore.getState();

        this.officerTaskRunner = new OfficerTaskRunner({
            stateStore: this.stateStore,
            emit: this.emit,
            completeTimedTasksImmediately,
        });

        this.contactSequenceRunner = new ContactSequenceRunner({
            emit: this.emit,
        });

        this.officerCommandExecutor = new OfficerCommandExecutor({
            stateStore: this.stateStore,
            emit: this.emit,
            startOfficerTask: this.officerTaskRunner.start,
            completeOfficerTask: this.officerTaskRunner.complete,
            startContactSequence: this.contactSequenceRunner.start,
        });

        this.emit({
            type: ENCOUNTER_EVENT.ENCOUNTER_LOADED,
            state: encounterState,
        });
    }

    // #region Public API

    public executeCommand(input: ExecuteOfficerCommandInput): ExecuteOfficerCommandResult {
        return this.officerCommandExecutor.execute(input);
    }

    public step(deltaMs: number): void {
        this.officerTaskRunner.step(deltaMs);
        this.contactSequenceRunner.step(deltaMs);
    }

    public completeArrival(): void {
        this.stateStore.completeArrival();
    }

    public completeTask(taskId: string): void {
        this.officerTaskRunner.complete(taskId);
    }

    public cancelTask(taskId: string): void {
        this.officerTaskRunner.cancel(taskId);
    }

    public getAvailableCommands(role: ExecuteOfficerCommandInput['role']): AvailableOfficerCommand[] {
        return getAvailableOfficerCommands(this.stateStore.getState(), role);
    }

    public getNavigationState(): PlayerSpaceNavigationState {
        return this.stateStore.getNavigationState();
    }

    public getOfficerAvailabilityStates(): OfficerAvailabilityStates {
        return getOfficerAvailabilityStates(this.stateStore.getState());
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
