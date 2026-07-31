// src/engine/encounter/officer_tasks/OfficerTaskResolver.ts

import { OFFICER_TASK_RESULT_KIND, type OfficerTaskResult } from '../model/event';
import { OFFICER_TASK_KIND, type OfficerTaskState } from '../model/officer_task';
import EncounterStateStore from '../state/EncounterStateStore';

type CommsRequestDockingTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.COMMS_REQUEST_DOCKING;
    }
>;

type HelmFlyToTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.HELM_FLY_TO;
    }
>;

type SciencePlotCourseTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE;
    }
>;

type ScienceIdentifyThreatTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT;
    }
>;

type EngineerDeployShieldTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD;
    }
>;

type WeaponsPointDefenseTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE;
    }
>;

// Применяет domain effects завершённой officer task.
//
// Не управляет lifecycle task:
// - не создаёт runtime id;
// - не двигает progress;
// - не удаляет task;
// - не эмитит lifecycle events.
export default class OfficerTaskResolver {
    constructor(
        private readonly stateStore: EncounterStateStore,
        private readonly purgeSpamChannel: (channelId: string) => boolean,
    ) {}

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

            case OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM:
                this.purgeSpamChannel(task.channelId);
                return undefined;

            case OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD:
                return this.resolveEngineerDeployShieldTask(task);

            case OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE:
                return this.resolveWeaponsPointDefenseTask(task);

            case OFFICER_TASK_KIND.COMMS_HAIL:
            case OFFICER_TASK_KIND.HELM_DOCK:
            case OFFICER_TASK_KIND.HELM_JUMP:
                return undefined;

            default:
                return this.assertNever(task);
        }
    }

    private resolveCommsRequestDockingTask(task: CommsRequestDockingTaskState): OfficerTaskResult {
        this.stateStore.grantDockingClearance(task.targetAnchorId);

        return {
            kind: OFFICER_TASK_RESULT_KIND.DOCKING_CLEARANCE_GRANTED,

            targetAnchorId: task.targetAnchorId,
        };
    }

    private resolveHelmFlyToTask(task: HelmFlyToTaskState): void {
        this.stateStore.completeTravel(task.targetAnchorId);
    }

    private resolveSciencePlotCourseTask(task: SciencePlotCourseTaskState): OfficerTaskResult {
        const anchor = this.stateStore.createJumpPoint(task.targetNodeId);

        return {
            kind: OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED,

            anchor,
        };
    }

    private resolveScienceIdentifyThreatTask(task: ScienceIdentifyThreatTaskState): OfficerTaskResult | undefined {
        const identification = this.stateStore.identifyThreat(task.threatId);

        if (!identification) {
            return undefined;
        }

        return {
            kind: OFFICER_TASK_RESULT_KIND.THREAT_IDENTIFIED,

            threatId: task.threatId,
            identification,
        };
    }

    private resolveEngineerDeployShieldTask(
        task: EngineerDeployShieldTaskState,
    ): OfficerTaskResult {
        const shield = this.stateStore.deployPlayerShield(task.shieldZone);

        return {
            kind: OFFICER_TASK_RESULT_KIND.SHIELD_DEPLOYED,

            shield,
        };
    }

    private resolveWeaponsPointDefenseTask(task: WeaponsPointDefenseTaskState): OfficerTaskResult | undefined {
        const outcome = this.stateStore.firePointDefense(task.threatId, task.pointDefenseBeamBand);

        if (!outcome) {
            return undefined;
        }

        return {
            kind: OFFICER_TASK_RESULT_KIND.POINT_DEFENSE_FIRED,

            threatId: task.threatId,

            beamBand: task.pointDefenseBeamBand,
            outcome,
        };
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled officer task: ${String(value)}`);
    }
}
