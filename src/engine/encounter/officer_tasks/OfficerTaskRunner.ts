// src/engine/encounter/officer_tasks/OfficerTaskRunner.ts

import { ENCOUNTER_TEAM } from "../../defs/encounter_team";
import { OFFICER_ROLE } from "../../defs/officer";
import { PLAYER_SPACE_NAVIGATION_KIND } from "../../defs/player_location";
import { ENCOUNTER_EVENT, OFFICER_TASK_OUTCOME, type EncounterEvent, type OfficerTaskResult } from "../model/event";
import { getOfficerTaskCancellationPolicy } from "../../content/catalogs/officer_tasks";
import { OFFICER_TASK_KIND, type OfficerTaskDraft, type OfficerTaskState } from "../model/officer_task";
import { getActiveEnemySpamChannels } from "../combat/queries/get_active_enemy_spam_channels";
import { getOfficerCommandDef } from "../commands/officer_command_handlers";
import { getPlayerCrewProgressMultiplier } from "../crew_performance/get_crew_progress_multiplier";
import EncounterStateStore from "../state/EncounterStateStore";
import { createHelmFlyToTask } from "./create_officer_task_draft";
import OfficerTaskEffects from "./OfficerTaskEffects";

type OfficerTaskRunnerOptions = {
    stateStore: EncounterStateStore;
    emit: (event: EncounterEvent) => void;

    purgeSpamChannel: (channelId: string) => boolean;
    clearStickyMine: (mineId: string) => boolean;

    random: () => number;

    completeTimedTasksImmediately?: boolean;
};

type PlayerWeaponTargetTaskState = Extract<
    OfficerTaskState,
    {
        kind:
            | typeof OFFICER_TASK_KIND.WEAPONS_FIRE_MISSILE
            | typeof OFFICER_TASK_KIND.WEAPONS_FIRE_STICKY_MINES
            | typeof OFFICER_TASK_KIND.WEAPONS_FIRE_BEAM_CANNON
            | typeof OFFICER_TASK_KIND.SCIENCE_FIRE_SPAM;
    }
>;

// Управляет lifecycle officer tasks:
//
// - создаёт runtime task;
// - хранит progress;
// - завершает и отменяет task;
// - эмитит lifecycle events.
//
// Task-specific domain effects выполняет OfficerTaskEffects.
export default class OfficerTaskRunner {
    private readonly stateStore: EncounterStateStore;

    private readonly emit: (event: EncounterEvent) => void;

    private readonly completeTimedTasksImmediately: boolean;

    private readonly random: () => number;

    private readonly taskEffects: OfficerTaskEffects;

    private nextTaskId = 1;

    constructor({
        stateStore,
        emit,

        purgeSpamChannel,
        clearStickyMine,

        random,
        completeTimedTasksImmediately = false,
    }: OfficerTaskRunnerOptions) {
        this.stateStore = stateStore;
        this.emit = emit;
        this.random = random;
        this.completeTimedTasksImmediately = completeTimedTasksImmediately;

        this.taskEffects = new OfficerTaskEffects(
            this.stateStore,
            purgeSpamChannel,
            clearStickyMine,
            this.emit,
            this.random,
        );

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

        const result = this.taskEffects.applyCompletion(task);

        this.finishTask(task, OFFICER_TASK_OUTCOME.COMPLETED, result);
    };

    public cancel = (taskId: string): void => {
        const task = this.stateStore.findOfficerTaskById(taskId);

        if (!task) {
            return;
        }

        this.taskEffects.applyCancellation(task);

        this.finishTask(task, OFFICER_TASK_OUTCOME.CANCELLED);
    };

    public interruptRandomTaskByDamage(): void {
        const interruptibleTasks = this.stateStore.getOfficerTasks().filter((task) => {
            return task.canBeInterruptedByDamage;
        });

        if (interruptibleTasks.length === 0) {
            return;
        }

        if (interruptibleTasks.length === 1) {
            const [task] = interruptibleTasks;

            if (!task) {
                throw new Error("Cannot interrupt missing officer task");
            }

            this.cancel(task.id);
            return;
        }

        const randomValue = this.random();

        if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
            throw new Error(`Encounter random source must return a value in [0, 1): ${randomValue}`);
        }

        const taskIndex = Math.floor(randomValue * interruptibleTasks.length);

        const task = interruptibleTasks[taskIndex];

        if (!task) {
            throw new Error(`Cannot select random officer task: ` + `${taskIndex}/${interruptibleTasks.length}`);
        }

        this.cancel(task.id);
    }

    public step(deltaMs: number): void {
        const progressDeltaMs = deltaMs * getPlayerCrewProgressMultiplier(this.stateStore.getState());

        for (const task of this.stateStore.getOfficerTasks()) {
            if (task.durationMs === null) {
                continue;
            }

            this.stateStore.advanceOfficerTask(task.id, progressDeltaMs);
        }

        this.completeFinishedTasks();
    }

    public cancelTasksRequiringOnlineDrive(): void {
        const tasks = this.stateStore.getOfficerTasks().filter((task) => {
            return getOfficerCommandDef(task.sourceCommandId).requiresOnlineDrive;
        });

        for (const task of tasks) {
            this.cancel(task.id);
        }
    }

    public cancelTasksWithMissingTargets(): void {
        const state = this.stateStore.getState();

        const activeSpamChannelIds = new Set(getActiveEnemySpamChannels(state).map((channel) => channel.id));

        const activeStickyMineIds = new Set(state.combat.stickyMines.map((mine) => mine.id));

        const invalidTaskIds = this.stateStore
            .getOfficerTasks()
            .filter((task) => {
                if (task.kind === OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM) {
                    return !activeSpamChannelIds.has(task.channelId);
                }

                if (task.kind === OFFICER_TASK_KIND.CLEAR_STICKY_MINE) {
                    return !activeStickyMineIds.has(task.mineId);
                }

                if (isPlayerWeaponTargetTask(task)) {
                    const targetActor = state.actors.find((actor) => {
                        return actor.id === task.targetActorId;
                    });

                    const weapon = this.stateStore.findPlayerWeaponById(task.weaponId);

                    return targetActor?.team !== ENCOUNTER_TEAM.ENEMY || !weapon;
                }

                return false;
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

function isPlayerWeaponTargetTask(task: OfficerTaskState): task is PlayerWeaponTargetTaskState {
    switch (task.kind) {
        case OFFICER_TASK_KIND.WEAPONS_FIRE_MISSILE:

        case OFFICER_TASK_KIND.WEAPONS_FIRE_STICKY_MINES:

        case OFFICER_TASK_KIND.WEAPONS_FIRE_BEAM_CANNON:

        case OFFICER_TASK_KIND.SCIENCE_FIRE_SPAM:
            return true;

        default:
            return false;
    }
}
