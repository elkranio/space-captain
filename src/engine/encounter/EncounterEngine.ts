// src/engine/encounter/EncounterEngine.ts

import type { OfficerRole } from '../defs/officer';
import type { PlayerSpaceNavigationState } from '../defs/player_location';
import type { SpaceNodeState } from '../defs/universe';
import OfficerCommandExecutor from './commands/OfficerCommandExecutor';
import { getAvailableOfficerCommands } from './commands/queries/get_available_officer_commands';
import ContactSequenceRunner from './contact/ContactSequenceRunner';
import type { AvailableOfficerCommand, ExecuteOfficerCommandInput, ExecuteOfficerCommandResult } from './model/command';
import { ENCOUNTER_EVENT, type EncounterEvent } from './model/event';
import type { OfficerAvailabilityStates } from './model/officer_availability';
import { OFFICER_TASK_KIND, type OfficerTaskKind, type OfficerTaskState } from './model/officer_task';
import { getOfficerAvailabilityStates } from './officer_availability/queries/get_officer_availability_states';
import OfficerTaskRunner from './officer_tasks/OfficerTaskRunner';
import EncounterStateStore from './state/EncounterStateStore';
import CombatRunner from './combat/CombatRunner';
import type { CombatProjectileState } from './model/combat';

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

    private readonly combatRunner: CombatRunner;

    constructor({ node, navigation, completeTimedTasksImmediately = false }: EncounterEngineOptions) {
        this.stateStore = EncounterStateStore.fromSpaceNode(node, navigation);

        const encounterState = this.stateStore.getState();

        this.combatRunner = new CombatRunner({
            state: encounterState,
            emit: this.emit,
        });

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

            // Generic completion остаётся внутренней связью
            // command handler → task runner для HAIL.
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
        this.combatRunner.step(deltaMs);
    }

    public completeArrival(): void {
        this.stateStore.completeArrival();
    }

    public completeTravel(taskId: string): void {
        this.completeExpectedTask(taskId, OFFICER_TASK_KIND.HELM_FLY_TO);
    }

    public completeDocking(taskId: string): void {
        this.completeExpectedTask(taskId, OFFICER_TASK_KIND.HELM_DOCK);
    }

    public completeJump(taskId: string): void {
        this.completeExpectedTask(taskId, OFFICER_TASK_KIND.HELM_JUMP);
    }

    public cancelTask(taskId: string): void {
        this.officerTaskRunner.cancel(taskId);
    }

    public getAvailableCommands(role: OfficerRole): AvailableOfficerCommand[] {
        return getAvailableOfficerCommands(this.stateStore.getState(), role);
    }

    public getNavigationState(): PlayerSpaceNavigationState {
        return this.stateStore.getNavigationState();
    }

    public getOfficerAvailabilityStates(): OfficerAvailabilityStates {
        return getOfficerAvailabilityStates(this.stateStore.getState());
    }

    public getOfficerTasks(): OfficerTaskState[] {
        return this.stateStore.getOfficerTasks().map((task) => {
            return {
                ...task,
            };
        });
    }

    public getCombatProjectiles(): CombatProjectileState[] {
        return this.stateStore.getState().combat.projectiles.map((projectile) => {
            return {
                ...projectile,
            };
        });
    }

    public drainEvents(): EncounterEvent[] {
        const events = [...this.events];

        this.events.length = 0;

        return events;
    }

    // #endregion

    // #region Officer task completion

    private completeExpectedTask(taskId: string, expectedKind: OfficerTaskKind): void {
        const task = this.stateStore.findOfficerTaskById(taskId);

        if (!task) {
            throw new Error(`Officer task not found: ${taskId}`);
        }

        if (task.kind !== expectedKind) {
            throw new Error(
                `Cannot complete officer task ${taskId}: ` + `expected ${expectedKind}, ` + `received ${task.kind}`,
            );
        }

        this.officerTaskRunner.complete(taskId);
    }

    // #endregion

    // #region Event outbox

    private emit = (event: EncounterEvent): void => {
        this.events.push(event);
    };

    // #endregion
}
