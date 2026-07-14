// src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts

import type { OfficerRole } from '../../../../../../engine/defs/officer';
import EncounterEngine from '../../../../../../engine/encounter/EncounterEngine';
import type {
    EncounterOfficerCommand,
    EncounterOfficerCommandId,
} from '../../../../../../engine/encounter/encounter_command';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../../../../../../engine/encounter/encounter_event';
import type { EncounterState } from '../../../../../../engine/encounter/encounter_state';
import { BRIDGE_EVENT } from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import { createOfficerCommandMenuGroups } from './create_officer_command_menu_groups';
import { mapEncounterObjectsToViewState } from './map_encounter_objects_to_view_state';

const SKIP_ARRIVAL = true;

export default class BridgeEncounterController {
    // #region Fields

    private encounterEngine?: EncounterEngine;
    private isEncounterActive = false;

    // #endregion

    // #region Lifecycle

    constructor(private readonly eventBus: BridgeEventBus) {}

    public prepare(): void {
        this.eventBus.on(BRIDGE_EVENT.OFFICER_SEAT_CLICKED, this.handleOfficerSeatClicked, this);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);

        this.eventBus.on(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);

        this.loadEncounter();
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.OFFICER_SEAT_CLICKED, this.handleOfficerSeatClicked, this);

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);

        this.eventBus.off(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);

        this.encounterEngine = undefined;
        this.isEncounterActive = false;
    }

    // #endregion

    // #region Scene update

    public step(deltaMs: number): void {
        if (!this.isEncounterActive) {
            return;
        }

        void deltaMs;

        // Later:
        // this.encounterEngine?.step(deltaMs);
        // this.processEncounterEvents();
    }

    // #endregion

    // #region Loading

    private loadEncounter(): void {
        this.encounterEngine = new EncounterEngine();
        this.processEncounterEvents();
    }

    // #endregion

    // #region Bridge events

    private handleOfficerSeatClicked(payload: { role: OfficerRole }): void {
        if (!this.isEncounterActive) {
            return;
        }

        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.requestOfficerCommands(payload.role);
        this.processEncounterEvents();
    }

    private handleEncounterArrivalCompleted(): void {
        this.isEncounterActive = true;
    }

    private handleOfficerCommandSelected(payload: {
        role: OfficerRole;
        commandId: EncounterOfficerCommandId;
        targetId?: string;
    }): void {
        if (!this.isEncounterActive) {
            return;
        }

        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.executeOfficerCommand(payload);
        this.processEncounterEvents();
    }

    // #endregion

    // #region Encounter events

    private processEncounterEvents(): void {
        if (!this.encounterEngine) {
            return;
        }

        for (const event of this.encounterEngine.drainEvents()) {
            this.handleEncounterEvent(event);
        }
    }

    private handleEncounterEvent(event: EncounterEvent): void {
        switch (event.type) {
            case ENCOUNTER_EVENT.ENCOUNTER_LOADED:
                this.handleEncounterLoaded(event.state);
                return;

            case ENCOUNTER_EVENT.OFFICER_COMMANDS_READY:
                this.handleOfficerCommandsReady(event.role, event.commands);
                return;
        }
    }

    private handleEncounterLoaded(state: EncounterState): void {
        const objects = mapEncounterObjectsToViewState(state);

        if (SKIP_ARRIVAL) {
            this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED, objects);
            this.isEncounterActive = true;
            return;
        }

        this.isEncounterActive = false;

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_PREPARED, objects);
        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, undefined);
    }

    private handleOfficerCommandsReady(role: OfficerRole, commands: EncounterOfficerCommand[]): void {
        this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_MENU_SYNCED, {
            role,
            groups: createOfficerCommandMenuGroups(commands),
        });
    }

    // #endregion
}
