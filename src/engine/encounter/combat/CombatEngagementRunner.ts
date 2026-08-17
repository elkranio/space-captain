// src/engine/encounter/combat/CombatEngagementRunner.ts

import type {
    EncounterTeam,
} from '../../defs/encounter_team';
import EncounterStateStore from '../state/EncounterStateStore';

// Hostile engagement currently has no opening player-drive disruption.
//
// The old disruption event/state infrastructure intentionally remains in the
// codebase, but combat entry itself is neutral while Helm Evade is being
// playtested. Team changes still go through this small orchestration boundary.
export default class CombatEngagementRunner {
    constructor(
        private readonly stateStore:
            EncounterStateStore,
    ) {}

    public engageCurrentHostileActors():
        void {
        // Intentionally no-op for the current combat prototype.
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
