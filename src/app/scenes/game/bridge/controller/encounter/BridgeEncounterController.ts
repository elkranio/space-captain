// src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts

import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
    type PlayerSpaceNavigationState,
} from '../../../../../../engine/defs/player_location';
import EncounterEngine from '../../../../../../engine/encounter/EncounterEngine';
import { createEncounterStateFromSpaceNode } from '../../../../../../engine/encounter/state/create_encounter_state_from_space_node';
import { DEBUG_SETTINGS } from '../../../../../debug/debug_settings';
import { GAME_RUNTIME } from '../../../../../runtime/GameRuntime';
import { SCENE_KEY } from '../../../../scene_key';
import {
    BRIDGE_EVENT,
    type BridgeEncounterTravelCompletedPayload,
    type BridgeOfficerCommandSelectedPayload,
    type BridgeOfficerSeatClickedPayload,
} from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import { createOfficerCommandMenuGroups } from './command_menu/create_officer_command_menu_groups';
import type { BridgeEncounterEventHandlerContext } from './engine_events/bridge_encounter_event_handler_context';
import { dispatchEncounterEvent } from './engine_events/dispatch_encounter_event';
import BridgeOfficerStationIndicatorsPoller from './officer_station_indicators/BridgeOfficerStationIndicatorsPoller';

// App-controller для bridge encounter flow.
//
// Держит EncounterEngine,
// принимает input events от bridge UI
// и переводит engine events
// в bridge events.
//
// Не содержит domain rules:
// доступность команд,
// contact flow
// и navigation state
// живут в engine.
export default class BridgeEncounterController {
    private encounterEngine?: EncounterEngine;

    private officerStationIndicatorsPoller?: BridgeOfficerStationIndicatorsPoller;

    private isEncounterInteractive = false;

    constructor(private readonly eventBus: BridgeEventBus) {}

    // #region Public API

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

    // #endregion

    // #region Bridge event registration

    private registerBridgeEventHandlers(): void {
        this.eventBus.on(
            BRIDGE_EVENT.OFFICER_SEAT_CLICKED,

            this.handleOfficerSeatClicked,

            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED,

            this.handleEncounterArrivalCompleted,

            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED,

            this.handleEncounterTravelCompleted,

            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.OFFICER_COMMAND_SELECTED,

            this.handleOfficerCommandSelected,

            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED,

            this.handleDockingAnimationCompleted,

            this,
        );
    }

    private unregisterBridgeEventHandlers(): void {
        this.eventBus.off(
            BRIDGE_EVENT.OFFICER_SEAT_CLICKED,

            this.handleOfficerSeatClicked,

            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED,

            this.handleEncounterArrivalCompleted,

            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED,

            this.handleEncounterTravelCompleted,

            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.OFFICER_COMMAND_SELECTED,

            this.handleOfficerCommandSelected,

            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED,

            this.handleDockingAnimationCompleted,

            this,
        );
    }

    // #endregion

    // #region Encounter setup

    private loadEncounter(): void {
        const run = GAME_RUNTIME.getCurrentRun();

        const location = run.player.location;

        if (location.kind !== PLAYER_LOCATION_KIND.SPACE) {
            throw new Error(`Cannot load bridge encounter for player location: ${location.kind}`);
        }

        const node = run.universe.nodes.find((candidate) => candidate.id === location.nodeId);

        if (!node) {
            throw new Error(`Space node not found: ${location.nodeId}`);
        }

        const state = createEncounterStateFromSpaceNode(node, location.navigation);

        this.encounterEngine = new EncounterEngine({
            state,

            completeTimedTasksImmediately: DEBUG_SETTINGS.bridge.officerTasks.completeTimedTasksImmediately,
        });

        this.officerStationIndicatorsPoller = new BridgeOfficerStationIndicatorsPoller(
            this.encounterEngine,
            this.eventBus,
        );

        this.drainEncounterEvents();
    }

    // #endregion

    // #region Bridge input handlers

    private handleOfficerSeatClicked(payload: BridgeOfficerSeatClickedPayload): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        this.openOfficerCommandMenu(payload.role);
    }

    private handleEncounterArrivalCompleted(): void {
        this.completeEncounterArrival();

        this.isEncounterInteractive = true;

        this.syncOfficerStationIndicators();
    }

    private handleEncounterTravelCompleted(payload: BridgeEncounterTravelCompletedPayload): void {
        this.completeEncounterTravel(payload.taskId);

        this.isEncounterInteractive = true;

        this.drainEncounterEvents();

        this.syncOfficerStationIndicators();
    }

    private handleOfficerCommandSelected(payload: BridgeOfficerCommandSelectedPayload): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        this.executeCommand(payload);
        this.requestOfficerCommandBark(payload);
    }

    private handleDockingAnimationCompleted(): void {
        this.eventBus.emit(BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED, {
            sceneKey: SCENE_KEY.END,
        });
    }

    // #endregion

    // #region Engine events

    private drainEncounterEvents(): void {
        if (!this.encounterEngine) {
            return;
        }

        const context = this.createEncounterEventHandlerContext();

        for (const event of this.encounterEngine.drainEvents()) {
            dispatchEncounterEvent(event, context);
        }
    }

    private createEncounterEventHandlerContext(): BridgeEncounterEventHandlerContext {
        return {
            eventBus: this.eventBus,

            setEncounterInteractive: (value) => {
                this.isEncounterInteractive = value;
            },
        };
    }

    // #endregion

    // #region Officer station indicators

    private updateOfficerStationIndicators(deltaMs: number): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        this.officerStationIndicatorsPoller?.step(deltaMs);
    }

    private syncOfficerStationIndicators(): void {
        this.officerStationIndicatorsPoller?.sync();
    }

    // #endregion

    // #region Officer commands

    private openOfficerCommandMenu(role: BridgeOfficerSeatClickedPayload['role']): void {
        if (!this.encounterEngine) {
            return;
        }

        const commands = this.encounterEngine.getAvailableCommands(role);

        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED,

            {
                role,

                groups: createOfficerCommandMenuGroups(commands),
            },
        );
    }

    private executeCommand(payload: BridgeOfficerCommandSelectedPayload): void {
        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.executeCommand(payload);

        this.syncRuntimeNavigationFromEngine();

        this.drainEncounterEvents();

        this.syncOfficerStationIndicators();
    }

    private requestOfficerCommandBark(payload: BridgeOfficerCommandSelectedPayload): void {
        if (!DEBUG_SETTINGS.bridge.officerCommands.showCommandBark) {
            return;
        }

        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_BARK_REQUESTED,

            {
                role: payload.role,

                text: DEBUG_SETTINGS.bridge.officerCommands.commandBarkText,
            },
        );
    }

    // #endregion

    // #region Encounter lifecycle

    private completeEncounterArrival(): void {
        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.completeArrival();

        this.syncRuntimeNavigationFromEngine(PLAYER_SPACE_NAVIGATION_KIND.ANCHORED);
    }

    private completeEncounterTravel(taskId: string): void {
        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.completeTask(taskId);

        this.syncRuntimeNavigationFromEngine(PLAYER_SPACE_NAVIGATION_KIND.ANCHORED);
    }

    // #endregion

    // #region Runtime synchronization

    private syncRuntimeNavigationFromEngine(expectedKind?: PlayerSpaceNavigationState['kind']): void {
        if (!this.encounterEngine) {
            return;
        }

        const run = GAME_RUNTIME.getCurrentRun();

        const location = run.player.location;

        if (location.kind !== PLAYER_LOCATION_KIND.SPACE) {
            throw new Error(`Cannot synchronize space navigation for player location: ${location.kind}`);
        }

        const navigation = this.encounterEngine.getNavigationState();

        if (expectedKind !== undefined && navigation.kind !== expectedKind) {
            throw new Error(`Expected engine navigation ${expectedKind}, received ${navigation.kind}`);
        }

        location.navigation = navigation;
    }

    // #endregion
}
