// src/engine/encounter/combat/CombatEngagementRunner.ts

import { ENCOUNTER_TEAM, type EncounterTeam } from "../../defs/encounter_team";
import { ENCOUNTER_EVENT, type EncounterEvent } from "../model/event";
import type OfficerTaskRunner from "../officer_tasks/OfficerTaskRunner";
import EncounterStateStore from "../state/EncounterStateStore";

// Applies one-shot combat-entry effects owned by enemy ship behavior.
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

    public setActorTeam(actorId: string, team: EncounterTeam): void {
        const actor = this.stateStore.setActorTeam(actorId, team);

        if (actor.team !== ENCOUNTER_TEAM.ENEMY) {
            return;
        }

        this.engageActor(actor.id);
    }

    private engageActor(actorId: string): void {
        const actor = this.stateStore.findActorById(actorId);

        if (!actor) {
            throw new Error(`Encounter actor not found during engagement: ${actorId}`);
        }

        if (!actor.behavior.disablePlayerDriveAtCombatStart) {
            return;
        }

        const pulseSource = this.stateStore.consumeOpeningDisruptionPulse(actor.id);

        // Each ship spends its opening pulse only once per encounter,
        // even if another hostile ship already disabled the drive.
        if (!pulseSource) {
            return;
        }

        const drive = this.stateStore.disablePlayerDrive();

        if (!drive) {
            return;
        }

        this.officerTaskRunner.cancelTasksRequiringOnlineDrive();

        this.emit({
            type: ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,

            sourceActorId: pulseSource.id,

            drive,
            navigation: this.stateStore.getNavigationState(),
        });
    }
}
