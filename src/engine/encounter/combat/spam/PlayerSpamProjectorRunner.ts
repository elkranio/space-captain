// src/engine/encounter/combat/PlayerSpamProjectorRunner.ts

import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { ENCOUNTER_TEAM } from "../../../defs/encounter_team";
import { OFFICER_ROLE } from "../../../defs/officer";
import {
    commitShipWeaponCooldown,
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
import type OfficerStatusRunner from "../../officer_statuses/OfficerStatusRunner";
import type OfficerTaskRunner from "../../officer_tasks/OfficerTaskRunner";

type ScientistFireSpamTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.SCIENTIST_FIRE_SPAM;
    }
>;

type PlayerSpamProjectorRunnerOptions = {
    stateStore: EncounterStateStore;

    emit: (event: EncounterEvent) => void;

    officerTaskRunner: Pick<OfficerTaskRunner, "complete">;
    officerStatusRunner: Pick<OfficerStatusRunner, "startNeuralRecovery">;
};

// Owns the player spam-projector lifecycle.
//
// Scientist owns cancellable TARGETING/PREPARE work. At COMMIT the officer
// task ends, neural recovery starts, and the projector continues autonomous
// CHANNELING/ACTIVE on the world clock.
//
// Active channels are exposed through the unified crew-progress effect
// query. CrewPerformanceResolver applies the content-defined slowdown to the
// targeted enemy crew while this channel remains active.
export default class PlayerSpamProjectorRunner {
    constructor(private readonly options: PlayerSpamProjectorRunnerOptions) {}

    public purgeChannel(channelId: string, targetActorId: string): boolean {
        for (const weapon of this.options.stateStore.getState().combat.playerWeapons) {
            if (
                weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR ||
                weapon.phase !== SHIP_WEAPON_PHASE.CHANNELING ||
                weapon.activeChannelId !== channelId ||
                weapon.activeTargetActorId !== targetActorId ||
                weapon.channelPurged
            ) {
                continue;
            }

            weapon.channelPurged = true;

            this.options.emit({
                type: ENCOUNTER_EVENT.PLAYER_SPAM_CHANNEL_ENDED,

                channelId,

                sourceWeaponId: weapon.id,

                targetActorId,

                outcome: PLAYER_SPAM_CHANNEL_OUTCOME.PURGED,
            });

            return true;
        }

        return false;
    }

    public step(deltaMs: number): void {
        for (const weapon of this.options.stateStore.getState().combat.playerWeapons) {
            if (weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR || weapon.phase !== SHIP_WEAPON_PHASE.CHANNELING) {
                continue;
            }

            this.advanceChanneling(weapon, deltaMs);
        }
    }

    public advanceTask(task: ScientistFireSpamTaskState): void {
        const projector = this.findTaskProjector(task);

        if (!projector) {
            return;
        }

        switch (projector.phase) {
            case SHIP_WEAPON_PHASE.TARGETING:
                if (!this.hasValidTarget(task)) {
                    // Shared missing-target cleanup cancels unfinished PREPARE
                    // at the end of the encounter step.
                    return;
                }

                this.advanceWarmup(task, projector);
                return;

            default:
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
    }

    private advanceWarmup(task: ScientistFireSpamTaskState, projector: SpamProjectorState): void {
        const durationMs = task.durationMs;

        if (durationMs === null) {
            throw new Error("Player spam warm-up task is missing duration: " + task.id);
        }

        projector.phaseElapsedMs = task.elapsedMs;

        if (task.elapsedMs < durationMs) {
            return;
        }

        const definition = this.getDefinition(projector);

        projector.phase = SHIP_WEAPON_PHASE.CHANNELING;
        projector.phaseElapsedMs = 0;
        projector.activeChannelId = "player_spam:" + task.id;
        projector.activeTargetActorId = task.targetActorId;
        projector.channelPurged = false;

        this.options.emit({
            type: ENCOUNTER_EVENT.PLAYER_SPAM_CHANNEL_STARTED,

            channelId: projector.activeChannelId,

            sourceWeaponId: projector.id,

            targetActorId: task.targetActorId,
        });

        this.options.officerTaskRunner.complete(task.id);
        this.options.officerStatusRunner.startNeuralRecovery(
            OFFICER_ROLE.SCIENTIST,
            definition.neuralRecoveryDurationMs,
        );
    }

    private advanceChanneling(projector: SpamProjectorState, deltaMs: number): void {
        const definition = this.getDefinition(projector);

        projector.phaseElapsedMs = Math.min(
            definition.channelDurationMs,

            projector.phaseElapsedMs + deltaMs,
        );

        if (projector.phaseElapsedMs < definition.channelDurationMs) {
            return;
        }

        const channelId = projector.activeChannelId;
        const targetActorId = projector.activeTargetActorId;
        const channelPurged = projector.channelPurged;

        if (!channelId || !targetActorId) {
            throw new Error("Player spam projector active channel is incomplete: " + projector.id);
        }

        projector.activeChannelId = null;
        projector.activeTargetActorId = null;
        projector.channelPurged = false;

        commitShipWeaponCooldown(projector, definition.cooldownDurationMs);

        finishShipWeaponAction(projector, definition.cooldownDurationMs);

        if (channelPurged) {
            this.options.emit({
                type: ENCOUNTER_EVENT.PLAYER_SPAM_PROJECTION_ENDED,

                channelId,

                sourceWeaponId: projector.id,

                targetActorId,
            });
        } else {
            this.options.emit({
                type: ENCOUNTER_EVENT.PLAYER_SPAM_CHANNEL_ENDED,

                channelId,

                sourceWeaponId: projector.id,

                targetActorId,

                outcome: PLAYER_SPAM_CHANNEL_OUTCOME.EXPIRED,
            });
        }
    }

    private findTaskProjector(task: ScientistFireSpamTaskState): SpamProjectorState | undefined {
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

    private hasValidTarget(task: ScientistFireSpamTaskState): boolean {
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
