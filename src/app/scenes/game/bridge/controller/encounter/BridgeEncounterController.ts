// src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts

import EncounterEngine from '../../../../../../engine/encounter/EncounterEngine';
import {
    BRIDGE_EVENT,
    type BridgeOfficerCommandSelectedPayload,
    type BridgeOfficerSeatClickedPayload,
} from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import { handleEncounterArrivalCompleted as handleEncounterArrivalCompletedInput } from './bridge_inputs/arrival/handle_encounter_arrival_completed';
import type { BridgeEncounterInputHandlerContext } from './bridge_inputs/bridge_encounter_input_handler_context';
import { handleDockingAnimationCompleted as handleDockingAnimationCompletedInput } from './bridge_inputs/docking/handle_docking_animation_completed';
import { handleOfficerCommandSelected as handleOfficerCommandSelectedInput } from './bridge_inputs/officer_commands/handle_officer_command_selected';
import { handleOfficerSeatClicked as handleOfficerSeatClickedInput } from './bridge_inputs/officer_commands/handle_officer_seat_clicked';
import type { BridgeEncounterEventHandlerContext } from './engine_events/bridge_encounter_event_handler_context';
import { dispatchEncounterEvent } from './engine_events/dispatch_encounter_event';
import BridgeOfficerStationIndicatorsPoller from './officer_station_indicators/BridgeOfficerStationIndicatorsPoller';

// App-controller для bridge encounter flow.
// Держит EncounterEngine, принимает input events от bridge UI и переводит engine events в bridge events.
// Не содержит domain rules: доступность команд, contact flow и docking state живут в engine.
export default class BridgeEncounterController {
    private encounterEngine?: EncounterEngine;
    private officerStationIndicatorsPoller?: BridgeOfficerStationIndicatorsPoller;
    private isEncounterInteractive = false;

    constructor(private readonly eventBus: BridgeEventBus) {}

    public prepare(): void {
        this.registerBridgeEventHandlers();
        this.loadEncounter();
    }

    public destroy(): void {
        this.unregisterBridgeEventHandlers();

        this.officerStationIndicatorsPoller?.destroy();
        this.officerStationIndicatorsPoller = undefined;

        this.encounterEngine = undefined;
        this.isEncounterInteractive = false;
    }

    public step(deltaMs: number): void {
        if (!this.encounterEngine) {
            return;
        }

        if (!this.isEncounterInteractive) {
            return;
        }

        this.encounterEngine.step(deltaMs);
        this.drainEncounterEvents();
        this.updateOfficerStationIndicators(deltaMs);
    }

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
        this.officerStationIndicatorsPoller = new BridgeOfficerStationIndicatorsPoller(
            this.encounterEngine,
            this.eventBus,
        );

        this.drainEncounterEvents();
    }

    private handleOfficerSeatClicked(payload: BridgeOfficerSeatClickedPayload): void {
        handleOfficerSeatClickedInput(payload, this.createEncounterInputHandlerContext());
    }

    private handleEncounterArrivalCompleted(): void {
        handleEncounterArrivalCompletedInput(this.createEncounterInputHandlerContext());
        this.syncOfficerStationIndicators();
    }

    private handleOfficerCommandSelected(payload: BridgeOfficerCommandSelectedPayload): void {
        handleOfficerCommandSelectedInput(payload, this.createEncounterInputHandlerContext());
    }

    private handleDockingAnimationCompleted(): void {
        handleDockingAnimationCompletedInput(this.createEncounterInputHandlerContext());
    }

    private drainEncounterEvents(): void {
        if (!this.encounterEngine) {
            return;
        }

        const context = this.createEncounterEventHandlerContext();

        for (const event of this.encounterEngine.drainEvents()) {
            dispatchEncounterEvent(event, context);
        }
    }

    private updateOfficerStationIndicators(deltaMs: number): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        this.officerStationIndicatorsPoller?.step(deltaMs);
    }

    private syncOfficerStationIndicators(): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        this.officerStationIndicatorsPoller?.sync();
    }

    private createEncounterEventHandlerContext(): BridgeEncounterEventHandlerContext {
        return {
            eventBus: this.eventBus,
            setEncounterInteractive: (value) => {
                this.isEncounterInteractive = value;
            },
        };
    }

    private createEncounterInputHandlerContext(): BridgeEncounterInputHandlerContext {
        return {
            eventBus: this.eventBus,

            isEncounterInteractive: () => this.isEncounterInteractive,

            setEncounterInteractive: (value) => {
                this.isEncounterInteractive = value;
            },

            requestOfficerCommands: (role) => {
                if (!this.encounterEngine) {
                    return;
                }

                this.encounterEngine.requestOfficerCommands(role);
                this.drainEncounterEvents();
            },

            executeOfficerCommand: (payload) => {
                if (!this.encounterEngine) {
                    return;
                }

                this.encounterEngine.executeOfficerCommand(payload);
                this.drainEncounterEvents();
                this.syncOfficerStationIndicators();
            },
        };
    }
}
