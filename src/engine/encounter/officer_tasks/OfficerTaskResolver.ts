// src/engine/encounter/officer_tasks/OfficerTaskResolver.ts

import { OFFICER_TASK_RESULT_KIND, type OfficerTaskResult } from '../model/event';
import { OFFICER_TASK_KIND, type OfficerTaskState } from '../model/officer_task';
import EncounterStateStore from '../state/EncounterStateStore';

// Применяет domain effects завершённой officer task.
//
// Не управляет lifecycle task:
// - не создаёт runtime id;
// - не двигает progress;
// - не удаляет task;
// - не эмитит lifecycle events.
export default class OfficerTaskResolver {
    constructor(private readonly stateStore: EncounterStateStore) {}

    public resolve(task: OfficerTaskState): OfficerTaskResult | undefined {
        switch (task.kind) {
            case OFFICER_TASK_KIND.COMMS_REQUEST_DOCKING:
                return this.resolveCommsRequestDockingTask(task);

            case OFFICER_TASK_KIND.HELM_FLY_TO:
                this.resolveHelmFlyToTask(task);
                return undefined;

            case OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE:
                return this.resolveSciencePlotCourseTask(task);

            case OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT:
                return this.resolveScienceIdentifyThreatTask(task);

            case OFFICER_TASK_KIND.COMMS_HAIL:
            case OFFICER_TASK_KIND.HELM_DOCK:
            case OFFICER_TASK_KIND.HELM_JUMP:
                return undefined;

            default:
                return this.assertNever(task.kind);
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

        const anchor = this.stateStore.createJumpPoint(task.targetNodeId);

        return {
            kind: OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED,
            anchor,
        };
    }

    private resolveScienceIdentifyThreatTask(task: OfficerTaskState): OfficerTaskResult | undefined {
        if (!task.targetId) {
            throw new Error('SCIENCE_IDENTIFY_THREAT task requires targetId');
        }

        const spectralBand = this.stateStore.identifyThreat(task.targetId);

        if (!spectralBand) {
            return undefined;
        }

        return {
            kind: OFFICER_TASK_RESULT_KIND.THREAT_IDENTIFIED,

            threatId: task.targetId,
            spectralBand,
        };
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled officer task kind: ${String(value)}`);
    }
}
