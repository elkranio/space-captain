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
import EncounterStateStore from '../state/EncounterStateStore';
import { createHelmFlyToTask } from './create_officer_task_draft';

type OfficerTaskRunnerOptions = {
    stateStore: EncounterStateStore;
    emit: (event: EncounterEvent) => void;
    completeTimedTasksImmediately?: boolean;
};

export default class OfficerTaskRunner {
    private readonly stateStore: EncounterStateStore;

    private readonly emit: (event: EncounterEvent) => void;

    private readonly completeTimedTasksImmediately: boolean;

    private nextTaskId = 1;

    constructor({ stateStore, emit, completeTimedTasksImmediately = false }: OfficerTaskRunnerOptions) {
        this.stateStore = stateStore;
        this.emit = emit;
        this.completeTimedTasksImmediately = completeTimedTasksImmediately;

        this.restoreMissingNavigationTask();
    }

    // #region Public API

    public start = (task: OfficerTaskDraft): string => {
        const runtimeTask = this.createRuntimeTask(task);

        this.stateStore.assignOfficerTask(runtimeTask);

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
        const task = this.stateStore.findOfficerTaskById(taskId);

        if (!task) {
            return;
        }

        const result = this.resolveTask(task);

        this.finishTask(task, OFFICER_TASK_OUTCOME.COMPLETED, result);
    };

    public cancel = (taskId: string): void => {
        const task = this.stateStore.findOfficerTaskById(taskId);

        if (!task) {
            return;
        }

        this.finishTask(task, OFFICER_TASK_OUTCOME.CANCELLED);
    };

    public step(deltaMs: number): void {
        this.stateStore.advanceOfficerTasks(deltaMs);
        this.completeFinishedTasks();
    }

    // #endregion

    // #region Runtime task creation

    private restoreMissingNavigationTask(): void {
        const navigation = this.stateStore.getNavigationState();

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING) {
            return;
        }

        if (this.stateStore.getOfficerTask(OFFICER_ROLE.HELM)) {
            return;
        }

        const runtimeTask = this.createRuntimeTask(createHelmFlyToTask(navigation.targetObjectId));

        this.stateStore.assignOfficerTask(runtimeTask);
    }

    private createRuntimeTask(task: OfficerTaskDraft): OfficerTaskState {
        return {
            ...task,
            id: this.createTaskId(),
            elapsedMs: 0,
        };
    }

    private createTaskId(): string {
        const taskId = `task_${this.nextTaskId}`;

        this.nextTaskId += 1;

        return taskId;
    }

    // #endregion

    // #region Timed tasks

    private completeFinishedTasks(): void {
        const finishedTaskIds = this.stateStore
            .getOfficerTasks()
            .filter((task) => {
                return task.durationMs !== null && task.elapsedMs >= task.durationMs;
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
            case OFFICER_TASK_KIND.HELM_JUMP:
                return undefined;

            case OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE:
                return this.resolveSciencePlotCourseTask(task);

            default:
                throw new Error(`Unhandled officer task kind: ${String(task.kind)}`);
        }
    }

    private resolveCommsRequestDockingTask(task: OfficerTaskState): OfficerTaskResult {
        if (!task.targetId) {
            throw new Error('COMMS_REQUEST_DOCKING task requires targetId');
        }

        this.stateStore.grantDockingClearance(task.targetId);

        return {
            kind: OFFICER_TASK_RESULT_KIND.DOCKING_CLEARANCE_GRANTED,
            targetObjectId: task.targetId,
        };
    }

    private resolveHelmFlyToTask(task: OfficerTaskState): void {
        if (!task.targetId) {
            throw new Error('HELM_FLY_TO task requires targetId');
        }

        this.stateStore.completeTravel(task.targetId);
    }

    private resolveSciencePlotCourseTask(task: OfficerTaskState): OfficerTaskResult {
        if (!task.targetNodeId) {
            throw new Error('SCIENCE_PLOT_COURSE task requires targetNodeId');
        }

        const object = this.stateStore.createJumpPoint(task.targetNodeId);

        return {
            kind: OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED,
            object,
        };
    }

    // #endregion

    // #region Task finish

    private finishTask(
        task: OfficerTaskState,
        outcome: (typeof OFFICER_TASK_OUTCOME)[keyof typeof OFFICER_TASK_OUTCOME],
        result?: OfficerTaskResult,
    ): void {
        const taskSnapshot = {
            ...task,
        };

        this.stateStore.removeOfficerTask(task.role);

        this.emit({
            type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,
            task: taskSnapshot,
            outcome,
            result,
        });
    }

    // #endregion
}
