// src/engine/encounter/combat/CombatEngagementRunner.ts

import {
    ENCOUNTER_TEAM,
    type EncounterTeam,
} from '../../defs/encounter_team';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../model/event';
import OfficerTaskRunner from '../officer_tasks/OfficerTaskRunner';
import EncounterStateStore from '../state/EncounterStateStore';

// Реагирует на вступление encounter ship в бой.
//
// Отдельный combat flag не хранится:
// hostile actor вступает в бой в момент initial engagement
// либо перехода в ENEMY.
export default class CombatEngagementRunner {
    constructor(
        private readonly stateStore: EncounterStateStore,
        private readonly officerTaskRunner: OfficerTaskRunner,
        private readonly emit: (event: EncounterEvent) => void,
    ) {}

    public engageCurrentHostileActors(): void {
        for (const actor of this.stateStore.getState().actors) {
            if (actor.team !== ENCOUNTER_TEAM.ENEMY) {
                continue;
            }

            this.engageActor(actor.id);
        }
    }

    public setActorTeam(
        actorId: string,
        team: EncounterTeam,
    ): void {
        const actor = this.stateStore.setActorTeam(
            actorId,
            team,
        );

        if (actor.team !== ENCOUNTER_TEAM.ENEMY) {
            return;
        }

        this.engageActor(actor.id);
    }

    private engageActor(actorId: string): void {
        const actor =
            this.stateStore.consumeOpeningDisruptionPulse(
                actorId,
            );

        // Каждый ship расходует opening pulse только один раз
        // за encounter, даже если drive уже отключён.
        if (!actor) {
            return;
        }

        const drive =
            this.stateStore.disablePlayerDrive();

        // Другой hostile ship уже отключил drive.
        if (!drive) {
            return;
        }

        this.officerTaskRunner
            .cancelTasksRequiringOnlineDrive();

        this.emit({
            type:
                ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,

            sourceActorId: actor.id,

            drive,
            navigation:
                this.stateStore.getNavigationState(),
        });
    }
}
