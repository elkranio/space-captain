// src/engine/encounter/combat/CombatEngagementRunner.ts

import type { EncounterTeam } from "../../defs/encounter_team";
import EncounterStateStore from "../state/EncounterStateStore";

export default class CombatEngagementRunner {
    constructor(private readonly stateStore: EncounterStateStore) {}

    // Encounter-start lifecycle boundary.
    //
    // It intentionally has no combat side effects right now.
    // Enemy debug behaviors live in the app/debug boundary and enemy AI will
    // eventually own real combat-start decisions.
    public engageCurrentHostileActors(): void {}

    public setActorTeam(actorId: string, team: EncounterTeam): void {
        this.stateStore.setActorTeam(actorId, team);
    }
}
