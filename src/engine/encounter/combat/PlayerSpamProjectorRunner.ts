// src/engine/encounter/combat/PlayerSpamProjectorRunner.ts

import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../content/catalogs/ship_weapons';
import {
    ENCOUNTER_TEAM,
} from '../../defs/encounter_team';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type SpamProjectorDefinition,
    type SpamProjectorState,
} from '../../defs/ship_weapon';
import {
    PLAYER_SPAM_CHANNEL_OUTCOME,
} from '../model/combat';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../model/event';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskState,
} from '../model/officer_task';
import type OfficerPerformanceResolver from '../officer_performance/OfficerPerformanceResolver';
import type EncounterStateStore from '../state/EncounterStateStore';

type ScienceFireSpamTaskState =
    Extract<
        OfficerTaskState,
        {
            kind:
                typeof OFFICER_TASK_KIND
                    .SCIENCE_FIRE_SPAM;
        }
    >;

type PlayerSpamProjectorRunnerOptions = {
    stateStore: EncounterStateStore;

    performanceResolver:
        OfficerPerformanceResolver;

    emit: (event: EncounterEvent) => void;

    completeOfficerTask:
        (taskId: string) => void;
};

// Owns the player spam-projector lifecycle.
//
// Targeting is officer-driven and therefore uses the player officer
// performance multiplier. Once the channel exists, its twenty-second
// physical lifetime advances in real encounter time.
//
// Active channels are exposed through one derived combat query.
// EnemyCrewPerformanceResolver applies the content-defined x0.5 slowdown
// to crew-driven enemy work while this channel remains active.
export default class PlayerSpamProjectorRunner {
    constructor(
        private readonly options:
            PlayerSpamProjectorRunnerOptions,
    ) {}

    public advanceTask(
        task: ScienceFireSpamTaskState,
        deltaMs: number,
    ): void {
        if (!this.hasValidTarget(task)) {
            // Shared missing-target cleanup cancels the task
            // at the end of the encounter step.
            return;
        }

        const projector =
            this.findTaskProjector(task);

        if (!projector) {
            return;
        }

        switch (projector.phase) {
            case SHIP_WEAPON_PHASE.TARGETING: {
                const effectiveDeltaMs =
                    deltaMs *
                    this.options
                        .performanceResolver
                        .getTaskProgressMultiplier(
                            task,
                        );

                this.advanceTargeting(
                    task,
                    projector,
                    effectiveDeltaMs,
                );

                return;
            }

            case SHIP_WEAPON_PHASE.CHANNELING:
                this.advanceChanneling(
                    task,
                    projector,
                    deltaMs,
                );

                return;

            default:
                throw new Error(
                    'Player spam task has invalid ' +
                        'weapon phase: ' +
                        task.id +
                        '/' +
                        projector.id +
                        '/' +
                        projector.phase,
                );
        }
    }

    private advanceTargeting(
        task: ScienceFireSpamTaskState,
        projector: SpamProjectorState,
        deltaMs: number,
    ): void {
        const elapsedMs =
            projector.phaseElapsedMs +
            deltaMs;

        if (
            elapsedMs <
            SHIP_WEAPON_TARGETING_DURATION_MS
        ) {
            projector.phaseElapsedMs =
                elapsedMs;

            return;
        }

        projector.phase =
            SHIP_WEAPON_PHASE.CHANNELING;

        projector.phaseElapsedMs = 0;

        projector.activeChannelId =
            'player_spam:' +
            task.id;

        this.options.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_SPAM_CHANNEL_STARTED,

            channelId:
                projector.activeChannelId,

            sourceWeaponId:
                projector.id,

            targetActorId:
                task.targetActorId,
        });
    }

    private advanceChanneling(
        task: ScienceFireSpamTaskState,
        projector: SpamProjectorState,
        deltaMs: number,
    ): void {
        const definition =
            this.getDefinition(
                projector,
            );

        projector.phaseElapsedMs =
            Math.min(
                definition.channelDurationMs,

                projector.phaseElapsedMs +
                    deltaMs,
            );

        if (
            projector.phaseElapsedMs <
            definition.channelDurationMs
        ) {
            return;
        }

        const channelId =
            projector.activeChannelId;

        if (!channelId) {
            throw new Error(
                'Player spam projector channel ' +
                    'id is missing: ' +
                    task.id +
                    '/' +
                    projector.id,
            );
        }

        projector.activeChannelId =
            null;

        projector.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        projector.phaseElapsedMs = 0;

        this.options.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_SPAM_CHANNEL_ENDED,

            channelId,

            sourceWeaponId:
                projector.id,

            targetActorId:
                task.targetActorId,

            outcome:
                PLAYER_SPAM_CHANNEL_OUTCOME
                    .EXPIRED,
        });

        this.options.completeOfficerTask(
            task.id,
        );
    }

    private findTaskProjector(
        task: ScienceFireSpamTaskState,
    ): SpamProjectorState | undefined {
        const weapon =
            this.options.stateStore
                .findPlayerWeaponById(
                    task.weaponId,
                );

        if (!weapon) {
            return undefined;
        }

        if (
            weapon.kind !==
            SHIP_WEAPON_KIND
                .SPAM_PROJECTOR
        ) {
            throw new Error(
                'Player spam task references ' +
                    'non-projector weapon: ' +
                    task.id +
                    '/' +
                    weapon.id +
                    '/' +
                    weapon.kind,
            );
        }

        return weapon;
    }

    private hasValidTarget(
        task: ScienceFireSpamTaskState,
    ): boolean {
        const actor =
            this.options.stateStore
                .findActorById(
                    task.targetActorId,
                );

        return (
            actor?.team ===
            ENCOUNTER_TEAM.ENEMY
        );
    }

    private getDefinition(
        projector: SpamProjectorState,
    ): SpamProjectorDefinition {
        const definition =
            SHIP_WEAPONS[
                projector.weaponId
            ];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND
                .SPAM_PROJECTOR
        ) {
            throw new Error(
                'Player spam projector ' +
                    'definition mismatch: ' +
                    projector.id +
                    '/' +
                    projector.weaponId,
            );
        }

        return definition;
    }
}
