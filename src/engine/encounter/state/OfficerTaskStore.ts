// src/engine/encounter/state/OfficerTaskStore.ts

import type { OfficerRole } from "../../defs/officer";
import type { OfficerTaskState } from "../model/officer_task";
import type { EncounterState } from "../model/state";

// Owns mutable player officer-task storage.
export default class OfficerTaskStore {
    constructor(private readonly state: EncounterState) {}

    public getOfficerTask(role: OfficerRole): OfficerTaskState | undefined {
        return this.state.officerTasks[role];
    }

    public getOfficerTasks(): OfficerTaskState[] {
        return Object.values(this.state.officerTasks).filter((task): task is OfficerTaskState => {
            return task !== undefined;
        });
    }

    public findOfficerTaskById(taskId: string): OfficerTaskState | undefined {
        return this.getOfficerTasks().find((task) => {
            return task.id === taskId;
        });
    }

    public assignOfficerTask(task: OfficerTaskState): void {
        const activeTask = this.getOfficerTask(task.role);

        if (activeTask) {
            throw new Error(
                `Cannot assign officer task ${task.kind}: ` +
                    `officer ${task.role} is already busy with ${activeTask.kind}`,
            );
        }

        this.state.officerTasks[task.role] = task;
    }

    public removeOfficerTask(role: OfficerRole): void {
        delete this.state.officerTasks[role];
    }

    public advanceOfficerTask(taskId: string, progressDeltaMs: number): void {
        if (!Number.isFinite(progressDeltaMs) || progressDeltaMs < 0) {
            throw new Error("Invalid officer task progress delta: " + taskId + "/" + progressDeltaMs);
        }

        const task = this.findOfficerTaskById(taskId);

        if (!task || task.durationMs === null) {
            return;
        }

        task.elapsedMs = Math.min(task.elapsedMs + progressDeltaMs, task.durationMs);
    }
}
