// src/engine/encounter/officer_tasks/OfficerTaskResolver.ts

import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_RESULT_KIND,
    type EncounterEvent,
    type OfficerTaskResult,
} from '../model/event';
import { OFFICER_TASK_KIND, type OfficerTaskState } from '../model/officer_task';
import EncounterStateStore from '../state/EncounterStateStore';

type ResettablePlayerWeaponTaskState = Extract<
    OfficerTaskState,
    {
        kind:
            | typeof OFFICER_TASK_KIND
                  .WEAPONS_FIRE_MISSILE
            | typeof OFFICER_TASK_KIND
                  .WEAPONS_FIRE_LASER;
    }
>;

type WeaponsFireStickyMinesTaskState = Extract<
    OfficerTaskState,
    {
        kind:
            typeof OFFICER_TASK_KIND
                .WEAPONS_FIRE_STICKY_MINES;
    }
>;

type ClearStickyMineTaskState = Extract<
    OfficerTaskState,
    {
        kind:
            typeof OFFICER_TASK_KIND.CLEAR_STICKY_MINE;
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
        private readonly clearStickyMine: (mineId: string) => boolean,
        private readonly emit: (event: EncounterEvent) => void,
    ) {}

    public resolve(task: OfficerTaskState): OfficerTaskResult | undefined {
        switch (task.kind) {
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

            case OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE: {
                const drive =
                    this.stateStore.repairPlayerDrive();

                this.emit({
                    type:
                        ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_STATE_CHANGED,

                    drive,
                });

                return undefined;
            }

            case OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE:
                return this.resolveWeaponsPointDefenseTask(task);

            // Player weapon lifecycle
            // завершит task снаружи.
            case OFFICER_TASK_KIND.WEAPONS_FIRE_MISSILE:
            case OFFICER_TASK_KIND
                .WEAPONS_FIRE_STICKY_MINES:
            case OFFICER_TASK_KIND.WEAPONS_FIRE_LASER:
                return undefined;

            case OFFICER_TASK_KIND.CLEAR_STICKY_MINE:
                return this.resolveClearStickyMineTask(task);

            case OFFICER_TASK_KIND.HELM_DOCK:
            case OFFICER_TASK_KIND.HELM_JUMP:
                return undefined;

            default:
                return this.assertNever(task);
        }
    }

    public cancel(
        task: OfficerTaskState,
    ): void {
        switch (task.kind) {
            case OFFICER_TASK_KIND
                .WEAPONS_FIRE_STICKY_MINES:
                this.cancelWeaponsFireStickyMinesTask(
                    task,
                );
                return;

            case OFFICER_TASK_KIND
                .WEAPONS_FIRE_MISSILE:
            case OFFICER_TASK_KIND
                .WEAPONS_FIRE_LASER:
                this.cancelResettablePlayerWeaponTask(
                    task,
                );
                return;

            default:
                return;
        }
    }

    private cancelResettablePlayerWeaponTask(
        task: ResettablePlayerWeaponTaskState,
    ): void {
        this.stateStore.resetPlayerWeapon(
            task.weaponId,
        );
    }

    private cancelWeaponsFireStickyMinesTask(
        task: WeaponsFireStickyMinesTaskState,
    ): void {
        this.stateStore
            .cancelPlayerStickyMineDispensing(
                task.weaponId,
            );
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

    private resolveClearStickyMineTask(
        task: ClearStickyMineTaskState,
    ): OfficerTaskResult | undefined {
        if (!this.clearStickyMine(task.mineId)) {
            return undefined;
        }

        return {
            kind:
                OFFICER_TASK_RESULT_KIND.STICKY_MINE_CLEARED,

            mineId: task.mineId,
        };
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled officer task: ${String(value)}`);
    }
}
