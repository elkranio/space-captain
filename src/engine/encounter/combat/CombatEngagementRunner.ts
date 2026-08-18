// src/engine/encounter/combat/CombatEngagementRunner.ts

import { ENCOUNTER_TEAM } from "../../defs/encounter_team";
import { ENCOUNTER_EVENT, type EncounterEvent } from "../model/event";
import type OfficerTaskRunner from "../officer_tasks/OfficerTaskRunner";
import EncounterStateStore from "../state/EncounterStateStore";

// Executes combat-entry mechanics only when an authoritative caller requests them.
// The decision whether to use an effect belongs outside this runner.
export default class CombatEngagementRunner {
    constructor(
        private readonly stateStore: EncounterStateStore,
        private readonly officerTaskRunner: OfficerTaskRunner,
        private readonly emit: (event: EncounterEvent) => void,
    ) {}

    public tryUseOpeningDisruptionPulse(actorId: string): boolean {
        const actor = this.stateStore.findActorById(actorId);

        if (!actor) {
            throw new Error(`Encounter actor not found during opening disruption: ${actorId}`);
        }

        if (actor.team !== ENCOUNTER_TEAM.ENEMY) {
            return false;
        }

        const pulseSource = this.stateStore.consumeOpeningDisruptionPulse(actor.id);

        if (!pulseSource) {
            return false;
        }

        // Each ship spends its opening pulse only once per encounter,
        // even if another hostile ship already disabled the drive.
        const drive = this.stateStore.disablePlayerDrive();

        if (!drive) {
            return true;
        }

        this.officerTaskRunner.cancelTasksRequiringOnlineDrive();

        this.emit({
            type: ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,

            sourceActorId: pulseSource.id,

            drive,
            navigation: this.stateStore.getNavigationState(),
        });

        return true;
    }
}
