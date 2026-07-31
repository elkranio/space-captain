// src/engine/encounter/officer_tasks/OfficerTaskRunner.ts

import { OFFICER_ROLE } from '../../defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../defs/player_location';
import { ENCOUNTER_EVENT, OFFICER_TASK_OUTCOME, type EncounterEvent, type OfficerTaskResult } from '../model/event';
import {
    getOfficerTaskCancellationPolicy,
    OFFICER_TASK_KIND,
    type OfficerTaskDraft,
    type OfficerTaskState,
} from '../model/officer_task';
import { getActiveEnemySpamChannels } from '../combat/queries/get_active_enemy_spam_channels';
import OfficerPerformanceResolver from '../officer_performance/OfficerPerformanceResolver';
import EncounterStateStore from '../state/EncounterStateStore';
import { createHelmFlyToTask } from './create_officer_task_draft';
import OfficerTaskResolver from './OfficerTaskResolver';

type OfficerTaskRunnerOptions = {
    stateStore: EncounterStateStore;
    emit: (event: EncounterEvent) => void;

    purgeSpamChannel: (channelId: string) => boolean;

    completeTimedTasksImmediately?: boolean;
};

// Управляет lifecycle officer tasks:
//
// - создаёт runtime task;
// - хранит progress;
// - завершает и отменяет task;
// - эмитит lifecycle events.
//
// Task-specific domain effects выполняет OfficerTaskResolver.
export default class OfficerTaskRunner {
    private readonly stateStore: EncounterStateStore;

    private readonly emit: (event: EncounterEvent) => void;

    private readonly completeTimedTasksImmediately: boolean;

    private readonly taskResolver: OfficerTaskResolver;

    private readonly performanceResolver: OfficerPerformanceResolver;

    private nextTaskId = 1;

    constructor({
        stateStore,
        emit,

        purgeSpamChannel,

        completeTimedTasksImmediately = false,
    }: OfficerTaskRunnerOptions) {
        this.stateStore = stateStore;
        this.emit = emit;
        this.completeTimedTasksImmediately = completeTimedTasksImmediately;

        this.taskResolver = new OfficerTaskResolver(this.stateStore, purgeSpamChannel);

        this.performanceResolver = new OfficerPerformanceResolver(this.stateStore);

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

        const result = this.taskResolver.resolve(task);

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
        for (const task of this.stateStore.getOfficerTasks()) {
            if (task.durationMs === null) {
                continue;
            }

            const multiplier = this.performanceResolver.getTaskProgressMultiplier(task);

            this.stateStore.advanceOfficerTask(task.id, deltaMs * multiplier);
        }

        this.completeFinishedTasks();
    }

    public cancelTasksWithMissingTargets(): void {
        const activeSpamChannelIds = new Set(
            getActiveEnemySpamChannels(this.stateStore.getState()).map((channel) => channel.id),
        );

        const invalidTaskIds = this.stateStore
            .getOfficerTasks()
            .filter((task) => {
                return task.kind === OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM && !activeSpamChannelIds.has(task.channelId);
            })
            .map((task) => task.id);

        for (const taskId of invalidTaskIds) {
            this.cancel(taskId);
        }
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

        const runtimeTask = this.createRuntimeTask(createHelmFlyToTask(navigation.targetAnchorId));

        this.stateStore.assignOfficerTask(runtimeTask);
    }

    private createRuntimeTask(task: OfficerTaskDraft): OfficerTaskState {
        return {
            ...task,
            ...getOfficerTaskCancellationPolicy(task.kind),

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
