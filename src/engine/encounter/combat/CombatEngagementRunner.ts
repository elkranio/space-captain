// src/engine/encounter/combat/CombatEngagementRunner.ts

import {
    ENCOUNTER_TEAM,
    type EncounterTeam,
} from '../../defs/encounter_team';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../defs/player_location';
import EncounterStateStore from '../state/EncounterStateStore';

// Temporary combat-entry orchestration while enemy Evade is being playtested.
//
// The real enemy captain policy/executor will eventually decide and commit
// Evade. For now, every hostile ship at the player's current anchor starts the
// real shared Evade lifecycle once when engagement begins.
//
// This hook deliberately does not invent temporary enemy Helm-task or Power-Core
// rules. Remove the auto-start body once enemy policy owns the command.
export default class CombatEngagementRunner {
    constructor(
        private readonly stateStore:
            EncounterStateStore,
    ) {}

    public engageCurrentHostileActors():
        void {
        const navigation =
            this.stateStore
                .getNavigationState();

        if (
            navigation.kind !==
            PLAYER_SPACE_NAVIGATION_KIND
                .ANCHORED
        ) {
            return;
        }

        const actors =
            this.stateStore
                .getActorsAtAnchor(
                    navigation.anchorId,
                );

        for (
            const actor of
            actors
        ) {
            if (
                actor.team !==
                ENCOUNTER_TEAM.ENEMY
            ) {
                continue;
            }

            this.stateStore
                .tryStartActorEvade(
                    actor.id,
                );
        }
    }

    public setActorTeam(
        actorId: string,
        team: EncounterTeam,
    ): void {
        this.stateStore.setActorTeam(
            actorId,
            team,
        );
    }
}
