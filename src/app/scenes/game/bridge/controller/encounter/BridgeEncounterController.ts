// src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts

import type { CharacterPortraitId } from '../../../../../../engine/defs/character';
import type { OfficerRole } from '../../../../../../engine/defs/officer';
import EncounterEngine from '../../../../../../engine/encounter/EncounterEngine';
import type { AvailableOfficerCommand } from '../../../../../../engine/encounter/model/command';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../../../../../../engine/encounter/model/event';
import type { EncounterState } from '../../../../../../engine/encounter/model/state';
import { SCENE_KEY } from '../../../../scene_key';
import type BridgeScene from '../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeOfficerCommandSelectedPayload,
    type BridgeOfficerSeatClickedPayload,
} from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import { createOfficerCommandMenuGroups } from './officer_commands/create_officer_command_menu_groups';
import { mapEncounterObjectsToBridgeObjectPayloads } from './objects/map_encounter_objects_to_bridge_object_payloads';
import { DEBUG_SETTINGS } from '../../../../../debug/debug_settings';

// App-controller для bridge encounter flow.
// Держит EncounterEngine, принимает input events от bridge UI и переводит engine events в bridge events.
// Не содержит domain rules: доступность команд, contact flow и docking state живут в engine.
export default class BridgeEncounterController {
    // #region Fields

    private encounterEngine?: EncounterEngine;
    private isEncounterInteractive = false;

    // #endregion

    // #region Lifecycle

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {}

    public prepare(): void {
        this.registerBridgeEventHandlers();
        this.loadEncounter();
    }

    public destroy(): void {
        this.unregisterBridgeEventHandlers();

        this.encounterEngine = undefined;
        this.isEncounterInteractive = false;
    }

    // #endregion

    // #region Scene update

    public step(deltaMs: number): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.step(deltaMs);
        this.drainEncounterEvents();
    }

    // #endregion

    // #region Setup

    private registerBridgeEventHandlers(): void {
        this.eventBus.on(BRIDGE_EVENT.OFFICER_SEAT_CLICKED, this.handleOfficerSeatClicked, this);
        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);
        this.eventBus.on(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);
        this.eventBus.on(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED, this.handleDockingAnimationCompleted, this);
    }

    private unregisterBridgeEventHandlers(): void {
        this.eventBus.off(BRIDGE_EVENT.OFFICER_SEAT_CLICKED, this.handleOfficerSeatClicked, this);
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);
        this.eventBus.off(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);
        this.eventBus.off(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED, this.handleDockingAnimationCompleted, this);
    }

    private loadEncounter(): void {
        this.encounterEngine = new EncounterEngine();
        this.drainEncounterEvents();
    }

    // #endregion

    // #region Bridge input events

    private handleOfficerSeatClicked(payload: BridgeOfficerSeatClickedPayload): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.requestOfficerCommands(payload.role);
        this.drainEncounterEvents();
    }

    private handleEncounterArrivalCompleted(): void {
        this.isEncounterInteractive = true;
    }

    private handleOfficerCommandSelected(payload: BridgeOfficerCommandSelectedPayload): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.executeOfficerCommand(payload);
        this.drainEncounterEvents();

        this.requestOfficerCommandBark(payload.role);
    }

    private handleDockingAnimationCompleted(): void {
        this.scene.scene.start(SCENE_KEY.END);
    }

    // #endregion

    // #region Encounter engine events

    private drainEncounterEvents(): void {
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

            case ENCOUNTER_EVENT.AVAILABLE_OFFICER_COMMANDS_UPDATED:
                this.handleAvailableOfficerCommandsUpdated(event.role, event.commands);
                return;

            case ENCOUNTER_EVENT.CONTACT_STARTED:
                this.handleContactStarted(event.contactName, event.contactPortraitId);
                return;

            case ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED:
                this.handleContactMessageAdded(event.speakerName, event.text);
                return;

            case ENCOUNTER_EVENT.CONTACT_ENDED:
                this.handleContactEnded();
                return;

            case ENCOUNTER_EVENT.DOCKING_STARTED:
                this.handleDockingStarted(event.targetId);
                return;
        }
    }

    private handleEncounterLoaded(state: EncounterState): void {
        const objects = mapEncounterObjectsToBridgeObjectPayloads(state);

        if (DEBUG_SETTINGS.bridge.encounter.skipArrival) {
            this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, objects);
            this.isEncounterInteractive = true;
            return;
        }

        this.isEncounterInteractive = false;

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED, objects);
        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED);
    }

    private handleAvailableOfficerCommandsUpdated(role: OfficerRole, commands: AvailableOfficerCommand[]): void {
        this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED, {
            role,
            groups: createOfficerCommandMenuGroups(commands),
        });
    }

    private handleContactStarted(contactName: string, contactPortraitId: CharacterPortraitId): void {
        this.eventBus.emit(BRIDGE_EVENT.CONTACT_STARTED, {
            contactName,
            contactPortraitId,
        });
    }

    private handleContactMessageAdded(speakerName: string, text: string): void {
        this.eventBus.emit(BRIDGE_EVENT.CONTACT_MESSAGE_ADDED, {
            speakerName,
            text,
        });
    }

    private handleContactEnded(): void {
        this.eventBus.emit(BRIDGE_EVENT.CONTACT_ENDED);
    }

    private handleDockingStarted(targetId: string): void {
        this.isEncounterInteractive = false;

        this.eventBus.emit(BRIDGE_EVENT.DOCKING_STARTED, {
            targetId,
        });
    }

    // #endregion

    // #region Bridge output helpers

    private requestOfficerCommandBark(role: OfficerRole): void {
        if (!DEBUG_SETTINGS.bridge.officerCommands.showCommandBark) {
            return;
        }

        this.eventBus.emit(BRIDGE_EVENT.OFFICER_BARK_REQUESTED, {
            role,
            text: DEBUG_SETTINGS.bridge.officerCommands.commandBarkText,
        });
    }

    // #endregion
}
