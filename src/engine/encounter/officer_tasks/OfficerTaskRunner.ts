// src/engine/encounter/officer_tasks/OfficerTaskRunner.ts

import { ENCOUNTER_EVENT, type EncounterEvent } from '../model/event';
import { OFFICER_TASK_ID, type OfficerTaskState } from '../model/officer_task';
import type { EncounterState } from '../model/state';
import { grantDockingClearance } from '../state/grant_docking_clearance';

type OfficerTaskRunnerOptions = {
    state: EncounterState;
    emit: (event: EncounterEvent) => void;
};

export default class OfficerTaskRunner {
    private readonly state: EncounterState;
    private readonly emit: (event: EncounterEvent) => void;

    constructor({ state, emit }: OfficerTaskRunnerOptions) {
        this.state = state;
        this.emit = emit;
    }

    public start = (task: OfficerTaskState): void => {
        this.state.officerTasks[task.role] = task;

        this.emit({
            type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,
            role: task.role,
            taskId: task.id,
            label: task.label,
        });
    };

    public step(deltaMs: number): void {
        this.advanceTasks(deltaMs);
        this.resolveFinishedTasks();
    }

    private advanceTasks(deltaMs: number): void {
        for (const task of Object.values(this.state.officerTasks)) {
            if (!task) continue;

            task.elapsedMs = Math.min(task.elapsedMs + deltaMs, task.durationMs);
        }
    }

    private resolveFinishedTasks(): void {
        const finishedTasks = Object.values(this.state.officerTasks).filter((task): task is OfficerTaskState => {
            return Boolean(task && task.elapsedMs >= task.durationMs);
        });

        for (const task of finishedTasks) {
            this.resolveTask(task);

            delete this.state.officerTasks[task.role];

            this.emit({
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,
                role: task.role,
                taskId: task.id,
            });
        }
    }

    private resolveTask(task: OfficerTaskState): void {
        switch (task.id) {
            case OFFICER_TASK_ID.COMMS_REQUEST_DOCKING:
                this.resolveCommsRequestDockingTask(task);
                return;

            default:
                throw new Error(`Unhandled officer task: ${task.id}`);
        }
    }

    private resolveCommsRequestDockingTask(task: OfficerTaskState): void {
        if (!task.targetId) {
            throw new Error('COMMS_REQUEST_DOCKING task requires targetId');
        }

        grantDockingClearance(this.state, task.targetId);
    }
}
