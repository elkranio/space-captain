// src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts

import type { OfficerRole } from '../../../../../../engine/defs/officer';
import EncounterEngine from '../../../../../../engine/encounter/EncounterEngine';
import type {
    AvailableOfficerCommand,
    EncounterOfficerCommandId,
} from '../../../../../../engine/encounter/model/command';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../../../../../../engine/encounter/model/event';
import type { EncounterState } from '../../../../../../engine/encounter/model/state';
import { BRIDGE_EVENT } from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import { createOfficerCommandMenuGroups } from './create_officer_command_menu_groups';
import { mapEncounterObjectsToViewState } from './map_encounter_objects_to_view_state';
import type { CharacterPortraitId } from '../../../../../../engine/defs/character';
import BridgeScene from '../../BridgeScene';
import { SCENE_KEY } from '../../../../scene_key';

const SKIP_ARRIVAL = false;

export default class BridgeEncounterController {
    // #region Fields

    private encounterEngine?: EncounterEngine;
    private isEncounterActive = false;

    // #endregion

    // #region Lifecycle

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {}

    public prepare(): void {
        this.eventBus.on(BRIDGE_EVENT.OFFICER_SEAT_CLICKED, this.handleOfficerSeatClicked, this);
        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);
        this.eventBus.on(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);
        this.eventBus.on(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED, this.handleDockingAnimationCompleted, this);

        this.loadEncounter();
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.OFFICER_SEAT_CLICKED, this.handleOfficerSeatClicked, this);
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);
        this.eventBus.off(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);
        this.eventBus.off(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED, this.handleDockingAnimationCompleted, this);

        this.encounterEngine = undefined;
        this.isEncounterActive = false;
    }

    // #endregion

    // #region Scene update

    public step(deltaMs: number): void {
        if (!this.isEncounterActive) {
            return;
        }

        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.step(deltaMs);
        this.processEncounterEvents();
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

        this.eventBus.emit(BRIDGE_EVENT.OFFICER_BARK_REQUESTED, {
            role: payload.role,
            text: 'AYE, CAPTAIN.',
        });
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

            case ENCOUNTER_EVENT.AVAILABLE_OFFICER_COMMANDS_RESOLVED:
                this.handleOfficerCommandsReady(event.role, event.commands);
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

    private handleDockingStarted(targetId: string): void {
        this.isEncounterActive = false;

        this.eventBus.emit(BRIDGE_EVENT.DOCKING_STARTED, {
            targetId,
        });
    }

    private handleDockingAnimationCompleted(): void {
        this.scene.scene.start(SCENE_KEY.END);
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

    private handleOfficerCommandsReady(role: OfficerRole, commands: AvailableOfficerCommand[]): void {
        this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_MENU_SYNCED, {
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
        this.eventBus.emit(BRIDGE_EVENT.CONTACT_ENDED, undefined);
    }

    // #endregion
}
