// src/engine/encounter/officer_tasks/OfficerTaskRunner.ts

import { OFFICER_ROLE } from '../../defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../defs/player_location';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
    type EncounterEvent,
    type OfficerTaskResult,
} from '../model/event';
import { OFFICER_TASK_KIND, type OfficerTaskDraft, type OfficerTaskState } from '../model/officer_task';
import type { EncounterState } from '../model/state';
import { grantDockingClearance } from '../state/grant_docking_clearance';
import { createHelmFlyToTask } from './factories/create_helm_fly_to_task';

type OfficerTaskRunnerOptions = {
    state: EncounterState;

    emit: (event: EncounterEvent) => void;

    completeTimedTasksImmediately?: boolean;
};

export default class OfficerTaskRunner {
    private readonly state: EncounterState;

    private readonly emit: (event: EncounterEvent) => void;

    private readonly completeTimedTasksImmediately: boolean;

    private nextTaskId = 1;

    constructor({ state, emit, completeTimedTasksImmediately = false }: OfficerTaskRunnerOptions) {
        this.state = state;

        this.emit = emit;

        this.completeTimedTasksImmediately = completeTimedTasksImmediately;

        this.restoreMissingNavigationTask();
    }

    // #region Public API

    public start = (task: OfficerTaskDraft): string => {
        this.assertOfficerAvailable(task);

        const runtimeTask = this.createRuntimeTask(task);

        this.state.officerTasks[runtimeTask.role] = runtimeTask;

        this.emit({
            type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,

            task: {
                ...runtimeTask,
            },
        });

        if (this.completeTimedTasksImmediately && runtimeTask.durationMs !== null) {
            this.complete(runtimeTask.id);
        }

        return runtimeTask.id;
    };

    public complete = (taskId: string): void => {
        const task = this.findTaskById(taskId);

        if (!task) {
            return;
        }

        const result = this.resolveTask(task);

        this.finishTask(task, OFFICER_TASK_OUTCOME.COMPLETED, result);
    };

    public cancel = (taskId: string): void => {
        const task = this.findTaskById(taskId);

        if (!task) {
            return;
        }

        this.finishTask(task, OFFICER_TASK_OUTCOME.CANCELLED);
    };

    public step(deltaMs: number): void {
        this.advanceTasks(deltaMs);

        this.completeFinishedTasks();
    }

    // #endregion

    // #region Runtime task creation

    private restoreMissingNavigationTask(): void {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING) {
            return;
        }

        if (this.state.officerTasks[OFFICER_ROLE.HELM]) {
            return;
        }

        this.state.officerTasks[OFFICER_ROLE.HELM] = this.createRuntimeTask(
            createHelmFlyToTask(navigation.targetObjectId),
        );
    }

    private assertOfficerAvailable(task: OfficerTaskDraft): void {
        const activeTask = this.state.officerTasks[task.role];

        if (!activeTask) {
            return;
        }

        throw new Error(
            `Cannot start officer task ${task.kind}: officer ${task.role} is already busy with ${activeTask.kind}`,
        );
    }

    private createRuntimeTask(task: OfficerTaskDraft): OfficerTaskState {
        return {
            ...task,

            id: this.createTaskId(),
        };
    }

    private createTaskId(): string {
        const taskId = `task_${this.nextTaskId}`;

        this.nextTaskId += 1;

        return taskId;
    }

    // #endregion

    // #region Timed tasks

    private advanceTasks(deltaMs: number): void {
        for (const task of Object.values(this.state.officerTasks)) {
            if (!task || task.durationMs === null) {
                continue;
            }

            task.elapsedMs = Math.min(task.elapsedMs + deltaMs, task.durationMs);
        }
    }

    private completeFinishedTasks(): void {
        const finishedTaskIds = Object.values(this.state.officerTasks)
            .filter((task): task is OfficerTaskState => {
                return Boolean(task && task.durationMs !== null && task.elapsedMs >= task.durationMs);
            })
            .map((task) => task.id);

        for (const taskId of finishedTaskIds) {
            this.complete(taskId);
        }
    }

    // #endregion

    // #region Task resolution

    private resolveTask(task: OfficerTaskState): OfficerTaskResult | undefined {
        switch (task.kind) {
            case OFFICER_TASK_KIND.COMMS_REQUEST_DOCKING:
                return this.resolveCommsRequestDockingTask(task);

            case OFFICER_TASK_KIND.HELM_FLY_TO:
                this.resolveHelmFlyToTask(task);

                return undefined;

            case OFFICER_TASK_KIND.COMMS_HAIL:

            case OFFICER_TASK_KIND.HELM_DOCK:
                return undefined;

            default:
                throw new Error(`Unhandled officer task kind: ${String(task.kind)}`);
        }
    }

    private resolveCommsRequestDockingTask(task: OfficerTaskState): OfficerTaskResult {
        if (!task.targetId) {
            throw new Error('COMMS_REQUEST_DOCKING task requires targetId');
        }

        grantDockingClearance(this.state, task.targetId);

        return {
            kind: OFFICER_TASK_RESULT_KIND.DOCKING_CLEARANCE_GRANTED,

            targetObjectId: task.targetId,
        };
    }

    private resolveHelmFlyToTask(task: OfficerTaskState): void {
        if (!task.targetId) {
            throw new Error('HELM_FLY_TO task requires targetId');
        }

        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING) {
            throw new Error(`Cannot complete HELM_FLY_TO from navigation state: ${navigation.kind}`);
        }

        if (navigation.targetObjectId !== task.targetId) {
            throw new Error(
                `HELM_FLY_TO task target does not match navigation target: ${task.targetId} !== ${navigation.targetObjectId}`,
            );
        }

        this.state.navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorObjectId: task.targetId,
        };
    }

    // #endregion

    // #region Task lookup and finish

    private findTaskById(taskId: string): OfficerTaskState | undefined {
        return Object.values(this.state.officerTasks).find((task) => task?.id === taskId);
    }

    private finishTask(
        task: OfficerTaskState,
        outcome: (typeof OFFICER_TASK_OUTCOME)[keyof typeof OFFICER_TASK_OUTCOME],
        result?: OfficerTaskResult,
    ): void {
        const taskSnapshot = {
            ...task,
        };

        delete this.state.officerTasks[task.role];

        this.emit({
            type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

            task: taskSnapshot,

            outcome,

            result,
        });
    }

    // #endregion
}
