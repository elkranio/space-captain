// src/engine/encounter/officer_tasks/OfficerTaskResolver.ts

import { COMBAT_THREAT_KIND, MISSILE_SIGNATURE_INTEL_STATUS, PLAYER_SPAM_CHANNEL_OUTCOME } from "../model/combat";
import { MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE } from "../model/missile_signature_analysis";
import {
    MISSILE_SIGNATURE_ANALYSIS_PROFILE,
    resolveMissileSignatureAnalysis,
} from "../combat/intel/resolve_missile_signature_analysis";
import { ENCOUNTER_EVENT, OFFICER_TASK_RESULT_KIND, type EncounterEvent, type OfficerTaskResult } from "../model/event";
import { OFFICER_TASK_KIND, type OfficerTaskState } from "../model/officer_task";
import EncounterStateStore from "../state/EncounterStateStore";

type CancellablePlayerWeaponTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.WEAPONS_FIRE_MISSILE | typeof OFFICER_TASK_KIND.WEAPONS_FIRE_BEAM_CANNON;
    }
>;

type ScienceFireSpamTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.SCIENCE_FIRE_SPAM;
    }
>;

type WeaponsFireStickyMinesTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.WEAPONS_FIRE_STICKY_MINES;
    }
>;

type ClearStickyMineTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.CLEAR_STICKY_MINE;
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

type WeaponsDefenseTurretTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.WEAPONS_DEFENSE_TURRET;
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
        private readonly random: () => number,
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

            case OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE: {
                const drive = this.stateStore.repairPlayerDrive();

                this.emit({
                    type: ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_STATE_CHANGED,

                    drive,
                });

                return undefined;
            }

            case OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD: {
                const shield = this.stateStore.deployPlayerShield();

                this.emit({
                    type: ENCOUNTER_EVENT.PLAYER_SHIELD_DEPLOYED,

                    shield,
                });

                return undefined;
            }

            case OFFICER_TASK_KIND.WEAPONS_DEFENSE_TURRET:
                return this.resolveWeaponsDefenseTurretTask(task);

            // Player weapon lifecycle
            // завершит task снаружи.
            case OFFICER_TASK_KIND.WEAPONS_FIRE_MISSILE:
            case OFFICER_TASK_KIND.WEAPONS_FIRE_STICKY_MINES:
            case OFFICER_TASK_KIND.WEAPONS_FIRE_BEAM_CANNON:
            case OFFICER_TASK_KIND.SCIENCE_FIRE_SPAM:
                return undefined;

            case OFFICER_TASK_KIND.CLEAR_STICKY_MINE:
                return this.resolveClearStickyMineTask(task);

            case OFFICER_TASK_KIND.HELM_DOCK:
            case OFFICER_TASK_KIND.HELM_JUMP:
            case OFFICER_TASK_KIND.HELM_EVADE:
                return undefined;

            default:
                return this.assertNever(task);
        }
    }

    public cancel(task: OfficerTaskState): void {
        switch (task.kind) {
            case OFFICER_TASK_KIND.WEAPONS_FIRE_STICKY_MINES:
                this.cancelWeaponsFireStickyMinesTask(task);
                return;

            case OFFICER_TASK_KIND.SCIENCE_FIRE_SPAM:
                this.cancelScienceFireSpamTask(task);

                return;

            case OFFICER_TASK_KIND.WEAPONS_FIRE_MISSILE:
            case OFFICER_TASK_KIND.WEAPONS_FIRE_BEAM_CANNON:
                this.cancelResettablePlayerWeaponTask(task);
                return;

            case OFFICER_TASK_KIND.HELM_EVADE:
                this.stateStore.stopPlayerEvade();
                return;

            default:
                return;
        }
    }

    private cancelScienceFireSpamTask(task: ScienceFireSpamTaskState): void {
        const channelId = this.stateStore.cancelPlayerSpamProjection(task.weaponId);

        if (!channelId) {
            return;
        }

        this.emit({
            type: ENCOUNTER_EVENT.PLAYER_SPAM_CHANNEL_ENDED,

            channelId,

            sourceWeaponId: task.weaponId,

            targetActorId: task.targetActorId,

            outcome: PLAYER_SPAM_CHANNEL_OUTCOME.CANCELLED,
        });
    }

    private cancelResettablePlayerWeaponTask(task: CancellablePlayerWeaponTaskState): void {
        this.stateStore.finishCancelledPlayerWeapon(task.weaponId);
    }

    private cancelWeaponsFireStickyMinesTask(task: WeaponsFireStickyMinesTaskState): void {
        this.stateStore.cancelPlayerStickyMineDispensing(task.weaponId);
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
        const projectile = this.stateStore.getState().combat.projectiles.find((candidate) => {
            return candidate.id === task.threatId;
        });

        if (!projectile) {
            return undefined;
        }

        if (projectile.identification.status === MISSILE_SIGNATURE_INTEL_STATUS.CONFIRMED) {
            return {
                kind: OFFICER_TASK_RESULT_KIND.THREAT_IDENTIFIED,

                threatId: task.threatId,

                identification: {
                    kind: COMBAT_THREAT_KIND.MISSILE,

                    ...projectile.identification,
                },

                analysisConfidence: MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE.CERTAIN,
            };
        }

        const analysis = resolveMissileSignatureAnalysis({
            truth: projectile.signature,

            profile: MISSILE_SIGNATURE_ANALYSIS_PROFILE.STANDARD,

            random: this.random,
        });

        const identification = this.stateStore.identifyThreat(task.threatId, analysis.identification);

        if (!identification) {
            return undefined;
        }

        return {
            kind: OFFICER_TASK_RESULT_KIND.THREAT_IDENTIFIED,

            threatId: task.threatId,

            identification,

            analysisConfidence: analysis.confidence,
        };
    }

    private resolveWeaponsDefenseTurretTask(task: WeaponsDefenseTurretTaskState): OfficerTaskResult | undefined {
        const outcome = this.stateStore.fireDefenseTurret(task.threatId, this.random);

        if (!outcome) {
            return undefined;
        }

        return {
            kind: OFFICER_TASK_RESULT_KIND.DEFENSE_TURRET_FIRED,

            threatId: task.threatId,

            outcome,
        };
    }

    private resolveClearStickyMineTask(task: ClearStickyMineTaskState): OfficerTaskResult | undefined {
        if (!this.clearStickyMine(task.mineId)) {
            return undefined;
        }

        return {
            kind: OFFICER_TASK_RESULT_KIND.STICKY_MINE_CLEARED,

            mineId: task.mineId,
        };
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled officer task: ${String(value)}`);
    }
}
