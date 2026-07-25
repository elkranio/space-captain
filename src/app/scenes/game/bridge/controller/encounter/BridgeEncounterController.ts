// src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts

import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
    type PlayerSpaceNavigationState,
} from '../../../../../../engine/defs/player_location';
import EncounterEngine from '../../../../../../engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_REJECTION_REASON,
    type ExecuteOfficerCommandInput,
    type ExecuteOfficerCommandResult,
} from '../../../../../../engine/encounter/model/command';
import { DEBUG_SETTINGS } from '../../../../../debug/debug_settings';
import { GAME_RUNTIME } from '../../../../../runtime/GameRuntime';
import { SCENE_KEY } from '../../../../scene_key';
import {
    BRIDGE_EVENT,
    type BridgeEncounterTravelCompletedPayload,
    type BridgeOfficerCommandSelectedPayload,
    type BridgeOfficerSeatClickedPayload,
    type BridgeEncounterJumpPayload,
} from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeOfficerCommandMenuController from './command_menu/BridgeOfficerCommandMenuController';
import BridgeEncounterEngineEventHandler from './engine_events/BridgeEncounterEngineEventHandler';
import BridgeOfficerStationsController from './officer_stations/BridgeOfficerStationsController';
import { SPACE_OBJECT_KIND } from '../../../../../../engine/defs/universe';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_RESULT_KIND,
    type EncounterEvent,
} from '../../../../../../engine/encounter/model/event';

// App-controller для bridge encounter flow.
//
// Держит EncounterEngine,
// принимает input events от bridge UI
// и управляет encounter orchestration.
//
// Не содержит domain rules:
// доступность команд,
// contact flow
// и navigation state
// живут в engine.
export default class BridgeEncounterController {
    private encounterEngine?: EncounterEngine;
    private officerCommandMenuController?: BridgeOfficerCommandMenuController;
    private officerStationsController?: BridgeOfficerStationsController;
    private readonly engineEventHandler: BridgeEncounterEngineEventHandler;
    private isEncounterInteractive = false;

    constructor(private readonly eventBus: BridgeEventBus) {
        this.engineEventHandler = new BridgeEncounterEngineEventHandler(this.eventBus, (value) => {
            this.isEncounterInteractive = value;
        });
    }

    // #region Public API

    public prepare(): void {
        this.registerBridgeEventHandlers();
        this.loadEncounter();
    }

    public destroy(): void {
        this.unregisterBridgeEventHandlers();

        this.officerStationsController?.destroy();

        this.officerCommandMenuController = undefined;
        this.officerStationsController = undefined;
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
        this.officerStationsController?.step(deltaMs);
    }

    // #endregion

    // #region Bridge event registration

    private registerBridgeEventHandlers(): void {
        this.eventBus.on(BRIDGE_EVENT.OFFICER_SEAT_CLICKED, this.handleOfficerSeatClicked, this);
        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);
        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, this.handleEncounterTravelCompleted, this);
        this.eventBus.on(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);
        this.eventBus.on(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED, this.handleDockingAnimationCompleted, this);
        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_JUMP_COMPLETED, this.handleEncounterJumpCompleted, this);
    }

    private unregisterBridgeEventHandlers(): void {
        this.eventBus.off(BRIDGE_EVENT.OFFICER_SEAT_CLICKED, this.handleOfficerSeatClicked, this);
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, this.handleEncounterTravelCompleted, this);
        this.eventBus.off(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);
        this.eventBus.off(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED, this.handleDockingAnimationCompleted, this);
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_JUMP_COMPLETED, this.handleEncounterJumpCompleted, this);
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

        this.encounterEngine = new EncounterEngine({
            node,
            navigation: location.navigation,
            completeTimedTasksImmediately: DEBUG_SETTINGS.bridge.officerTasks.completeTimedTasksImmediately,
        });

        this.officerCommandMenuController = new BridgeOfficerCommandMenuController(this.encounterEngine, this.eventBus);

        this.officerStationsController = new BridgeOfficerStationsController(this.encounterEngine, this.eventBus);

        this.drainEncounterEvents();
    }

    // #endregion

    // #region Bridge input handlers

    private handleOfficerSeatClicked(payload: BridgeOfficerSeatClickedPayload): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        this.officerCommandMenuController?.open(payload.role);
    }

    private handleEncounterArrivalCompleted(): void {
        this.completeEncounterArrival();

        this.isEncounterInteractive = true;

        this.officerStationsController?.sync();
    }

    private handleEncounterTravelCompleted(payload: BridgeEncounterTravelCompletedPayload): void {
        this.completeEncounterTravel(payload.taskId);

        this.isEncounterInteractive = true;

        this.drainEncounterEvents();
        this.officerStationsController?.sync();
    }

    private handleEncounterJumpCompleted(payload: BridgeEncounterJumpPayload): void {
        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.completeTask(payload.taskId);
        this.drainEncounterEvents();

        GAME_RUNTIME.jumpPlayerToNode(payload.targetNodeId);

        this.eventBus.emit(BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED, {
            sceneKey: SCENE_KEY.BRIDGE,
        });
    }

    private handleOfficerCommandSelected(payload: BridgeOfficerCommandSelectedPayload): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        const result = this.executeCommand(payload);

        if (!result) {
            return;
        }

        this.handleOfficerCommandResult(payload, result);
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

        const events = this.encounterEngine.drainEvents();

        this.syncRuntimeObjectsFromEncounterEvents(events);
        this.engineEventHandler.handle(events);
    }

    // #endregion

    // #region Officer commands

    private executeCommand(payload: BridgeOfficerCommandSelectedPayload): ExecuteOfficerCommandResult | undefined {
        if (!this.encounterEngine) {
            return undefined;
        }

        const input = this.createExecuteCommandInput(payload);
        const result = this.encounterEngine.executeCommand(input);

        if (result.status === OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED) {
            this.syncRuntimeNavigationFromEngine();
            this.drainEncounterEvents();
            this.officerStationsController?.sync();
        }

        return result;
    }

    private createExecuteCommandInput(payload: BridgeOfficerCommandSelectedPayload): ExecuteOfficerCommandInput {
        if (payload.commandId !== ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE) {
            return payload;
        }

        return {
            ...payload,
            targetNodeId: this.getAutomaticPlotCourseTargetNodeId(),
        };
    }

    private getAutomaticPlotCourseTargetNodeId(): string {
        const run = GAME_RUNTIME.getCurrentRun();
        const currentNodeId = run.player.location.nodeId;

        const targetNode = run.universe.nodes.find((node) => {
            return node.id !== currentNodeId;
        });

        if (!targetNode) {
            throw new Error(`No plot-course destination available from node: ${currentNodeId}`);
        }

        return targetNode.id;
    }

    private handleOfficerCommandResult(
        payload: BridgeOfficerCommandSelectedPayload,
        result: ExecuteOfficerCommandResult,
    ): void {
        switch (result.status) {
            case OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED:
                this.requestOfficerCommandBark(payload);
                return;

            case OFFICER_COMMAND_EXECUTION_STATUS.REJECTED:
                switch (result.reason) {
                    case OFFICER_COMMAND_REJECTION_REASON.NOT_AVAILABLE:
                        return;

                    case OFFICER_COMMAND_REJECTION_REASON.OFFICERS_BUSY: {
                        const busyStations = result.busyRoles.map((role) => role.toUpperCase()).join(', ');

                        this.eventBus.emit(BRIDGE_EVENT.OFFICER_BARK_REQUESTED, {
                            role: payload.role,
                            text: `CAN'T DO THAT, CAPTAIN. BUSY STATIONS: ${busyStations}.`,
                        });
                        return;
                    }
                }
        }
    }

    private requestOfficerCommandBark(payload: BridgeOfficerCommandSelectedPayload): void {
        if (!DEBUG_SETTINGS.bridge.officerCommands.showCommandBark) {
            return;
        }

        this.eventBus.emit(BRIDGE_EVENT.OFFICER_BARK_REQUESTED, {
            role: payload.role,
            text: DEBUG_SETTINGS.bridge.officerCommands.commandBarkText,
        });
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

        const navigation = this.encounterEngine.getNavigationState();

        if (expectedKind !== undefined && navigation.kind !== expectedKind) {
            throw new Error(`Expected engine navigation ${expectedKind}, received ${navigation.kind}`);
        }

        GAME_RUNTIME.setPlayerSpaceNavigation(navigation);
    }

    private syncRuntimeObjectsFromEncounterEvents(events: EncounterEvent[]): void {
        for (const event of events) {
            if (event.type !== ENCOUNTER_EVENT.OFFICER_TASK_ENDED) {
                continue;
            }

            if (event.result?.kind !== OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED) {
                continue;
            }

            const anchor = event.result.anchor;

            GAME_RUNTIME.addCurrentNodeObject({
                kind: SPACE_OBJECT_KIND.JUMP_POINT,

                jumpPoint: {
                    ...anchor.jumpPoint,
                },

                localPosition: {
                    ...anchor.localPosition,
                },
            });
        }
    }

    // #endregion
}
