// src/engine/encounter/combat/PlayerSpamProjectorRunner.ts

import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { ENCOUNTER_TEAM } from "../../../defs/encounter_team";
import { OFFICER_ROLE } from "../../../defs/officer";
import {
    finishShipWeaponAction,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type SpamProjectorDefinition,
    type SpamProjectorState,
} from "../../../defs/ship_weapon";
import { PLAYER_SPAM_CHANNEL_OUTCOME } from "../../model/combat";
import { ENCOUNTER_EVENT, type EncounterEvent } from "../../model/event";
import { OFFICER_TASK_KIND, type OfficerTaskState } from "../../model/officer_task";
import type EncounterStateStore from "../../state/EncounterStateStore";
import type OfficerTaskRunner from "../../officer_tasks/OfficerTaskRunner";

type ScienceFireSpamTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.SCIENCE_FIRE_SPAM;
    }
>;

type PlayerSpamProjectorRunnerOptions = {
    stateStore: EncounterStateStore;

    emit: (event: EncounterEvent) => void;

    officerTaskRunner: Pick<OfficerTaskRunner, "complete">;
};

// Owns the player spam-projector lifecycle.
//
// The projection starts directly in CHANNELING.
// Its physical lifetime advances in real encounter time while Science
// remains occupied for the active operation.
//
// Active channels are exposed through the unified crew-progress effect
// query. CrewPerformanceResolver applies the content-defined slowdown to the
// targeted enemy crew while this channel remains active.
export default class PlayerSpamProjectorRunner {
    constructor(private readonly options: PlayerSpamProjectorRunnerOptions) {}

    public purgeChannel(channelId: string, targetActorId: string): boolean {
        const task = this.options.stateStore.getOfficerTask(OFFICER_ROLE.SCIENCE);

        if (!task || task.kind !== OFFICER_TASK_KIND.SCIENCE_FIRE_SPAM || task.targetActorId !== targetActorId) {
            return false;
        }

        const projector = this.findTaskProjector(task);

        if (!projector || projector.phase !== SHIP_WEAPON_PHASE.CHANNELING || projector.activeChannelId !== channelId) {
            return false;
        }

        const endedChannelId = this.options.stateStore.cancelPlayerSpamProjection(projector.id);

        if (endedChannelId !== channelId) {
            throw new Error(
                "Purged player spam channel " +
                    "does not match active channel: " +
                    targetActorId +
                    "/" +
                    channelId +
                    "/" +
                    String(endedChannelId),
            );
        }

        this.options.emit({
            type: ENCOUNTER_EVENT.PLAYER_SPAM_CHANNEL_ENDED,

            channelId,

            sourceWeaponId: projector.id,

            targetActorId,

            outcome: PLAYER_SPAM_CHANNEL_OUTCOME.PURGED,
        });

        this.options.officerTaskRunner.complete(task.id);

        return true;
    }

    public advanceTask(task: ScienceFireSpamTaskState, worldDeltaMs: number): void {
        if (!this.hasValidTarget(task)) {
            // Shared missing-target cleanup cancels the task
            // at the end of the encounter step.
            return;
        }

        const projector = this.findTaskProjector(task);

        if (!projector) {
            return;
        }

        if (projector.phase !== SHIP_WEAPON_PHASE.CHANNELING) {
            throw new Error(
                "Player spam task has invalid " +
                    "weapon phase: " +
                    task.id +
                    "/" +
                    projector.id +
                    "/" +
                    projector.phase,
            );
        }

        this.ensureChannelStarted(task, projector);

        this.advanceChanneling(task, projector, worldDeltaMs);
    }

    private ensureChannelStarted(task: ScienceFireSpamTaskState, projector: SpamProjectorState): void {
        if (projector.activeChannelId !== null) {
            return;
        }

        projector.activeChannelId = "player_spam:" + task.id;

        this.options.emit({
            type: ENCOUNTER_EVENT.PLAYER_SPAM_CHANNEL_STARTED,

            channelId: projector.activeChannelId,

            sourceWeaponId: projector.id,

            targetActorId: task.targetActorId,
        });
    }

    private advanceChanneling(task: ScienceFireSpamTaskState, projector: SpamProjectorState, deltaMs: number): void {
        const definition = this.getDefinition(projector);

        projector.phaseElapsedMs = Math.min(
            definition.channelDurationMs,

            projector.phaseElapsedMs + deltaMs,
        );

        if (projector.phaseElapsedMs < definition.channelDurationMs) {
            return;
        }

        const channelId = projector.activeChannelId;

        if (!channelId) {
            throw new Error("Player spam projector channel " + "id is missing: " + task.id + "/" + projector.id);
        }

        projector.activeChannelId = null;

        finishShipWeaponAction(projector, definition.cooldownDurationMs);

        this.options.emit({
            type: ENCOUNTER_EVENT.PLAYER_SPAM_CHANNEL_ENDED,

            channelId,

            sourceWeaponId: projector.id,

            targetActorId: task.targetActorId,

            outcome: PLAYER_SPAM_CHANNEL_OUTCOME.EXPIRED,
        });

        this.options.officerTaskRunner.complete(task.id);
    }

    private findTaskProjector(task: ScienceFireSpamTaskState): SpamProjectorState | undefined {
        const weapon = this.options.stateStore.findPlayerWeaponById(task.weaponId);

        if (!weapon) {
            return undefined;
        }

        if (weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
            throw new Error(
                "Player spam task references " +
                    "non-projector weapon: " +
                    task.id +
                    "/" +
                    weapon.id +
                    "/" +
                    weapon.kind,
            );
        }

        return weapon;
    }

    private hasValidTarget(task: ScienceFireSpamTaskState): boolean {
        const actor = this.options.stateStore.findActorById(task.targetActorId);

        return actor?.team === ENCOUNTER_TEAM.ENEMY;
    }

    private getDefinition(projector: SpamProjectorState): SpamProjectorDefinition {
        const definition = SHIP_WEAPONS[projector.weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
            throw new Error(
                "Player spam projector " + "definition mismatch: " + projector.id + "/" + projector.weaponId,
            );
        }

        return definition;
    }
}
