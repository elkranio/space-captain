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
    OFFICER_COMMAND_TARGET_KIND,
    type ExecuteOfficerCommandInput,
    type ExecuteOfficerCommandResult,
} from '../../../../../../engine/encounter/model/command';
import { DEBUG_SETTINGS } from '../../../../../debug/debug_settings';
import { GAME_RUNTIME } from '../../../../../runtime/GameRuntime';
import { SCENE_KEY } from '../../../../scene_key';
import {
    BRIDGE_EVENT,
    type BridgeDockingCompletedPayload,
    type BridgeEncounterJumpPayload,
    type BridgeEnemyShipDestructionPayload,
    type BridgeEncounterTravelCompletedPayload,
    type BridgeOfficerCommandMenuRefreshRequestedPayload,
    type BridgeOfficerCommandSelectedPayload,
    type BridgeOfficerStationClickedPayload,
    type BridgeOfficerTaskCancelSelectedPayload,
} from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeOfficerCommandMenuController from './command_menu/BridgeOfficerCommandMenuController';
import BridgeEncounterEngineEventHandler from './engine_events/BridgeEncounterEngineEventHandler';
import BridgeOfficerStationsController from './officer_stations/BridgeOfficerStationsController';
import BridgeEncounterSnapshotSynchronizer from './snapshots/BridgeEncounterSnapshotSynchronizer';

// App-controller для bridge encounter flow.
//
// Держит EncounterEngine,
// принимает input events от bridge UI
// и управляет encounter orchestration.
//
// Не содержит domain rules:
// - доступность и execution команд живут в engine;
// - officer tasks и combat живут в engine;
// - controller только синхронизирует engine, GAME_RUNTIME и bridge view.
export default class BridgeEncounterController {
    // #region Fields

    private encounterEngine?: EncounterEngine;

    private officerCommandMenuController?: BridgeOfficerCommandMenuController;

    private officerStationsController?: BridgeOfficerStationsController;

    private snapshotSynchronizer?: BridgeEncounterSnapshotSynchronizer;

    private readonly engineEventHandler: BridgeEncounterEngineEventHandler;

    private isEncounterInteractive = false;

    // #endregion

    constructor(private readonly eventBus: BridgeEventBus) {
        this.engineEventHandler = new BridgeEncounterEngineEventHandler(
            this.eventBus,

            (value) => {
                this.isEncounterInteractive = value;
            },

            GAME_RUNTIME,
        );
    }

    // #region Lifecycle

    public prepare(): void {
        this.registerBridgeEventHandlers();
        this.loadEncounter();
    }

    public destroy(): void {
        this.unregisterBridgeEventHandlers();

        this.officerStationsController?.destroy();
        this.officerCommandMenuController = undefined;
        this.officerStationsController = undefined;
        this.snapshotSynchronizer = undefined;
        this.encounterEngine = undefined;

        this.isEncounterInteractive = false;
    }

    // #endregion

    // #region Scene update

    public step(deltaMs: number): void {
        if (!this.encounterEngine) {
            return;
        }

        if (!this.isEncounterInteractive) {
            return;
        }

        this.encounterEngine.step(deltaMs);
        this.snapshotSynchronizer?.syncPlayerShipDashboard();
        this.drainEncounterEvents();
        this.snapshotSynchronizer?.syncCombatPresentation();

        this.officerStationsController?.step(deltaMs);
    }

    // #endregion

    // #region Bridge event registration

    private registerBridgeEventHandlers(): void {
        this.eventBus.on(BRIDGE_EVENT.OFFICER_STATION_CLICKED, this.handleOfficerStationClicked, this);

        this.eventBus.on(
            BRIDGE_EVENT.OFFICER_COMMAND_MENU_REFRESH_REQUESTED,
            this.handleOfficerCommandMenuRefreshRequested,
            this,
        );

        this.eventBus.on(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);

        this.eventBus.on(
            BRIDGE_EVENT.OFFICER_TASK_CANCEL_SELECTED,
            this.handleOfficerTaskCancelSelected,
            this,
        );

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);

        this.eventBus.on(
            BRIDGE_EVENT
                .ENCOUNTER_TRAVEL_FLIGHT_STARTED,

            this.handleEncounterTravelFlightStarted,
            this,
        );

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, this.handleEncounterTravelCompleted, this);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_JUMP_COMPLETED, this.handleEncounterJumpCompleted, this);

        this.eventBus.on(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED, this.handleDockingAnimationCompleted, this);

        this.eventBus.on(
            BRIDGE_EVENT
                .ENEMY_SHIP_DESTRUCTION_COMPLETED,

            this.handleEnemyShipDestructionCompleted,
            this,
        );
    }

    private unregisterBridgeEventHandlers(): void {
        this.eventBus.off(BRIDGE_EVENT.OFFICER_STATION_CLICKED, this.handleOfficerStationClicked, this);

        this.eventBus.off(
            BRIDGE_EVENT.OFFICER_COMMAND_MENU_REFRESH_REQUESTED,
            this.handleOfficerCommandMenuRefreshRequested,
            this,
        );

        this.eventBus.off(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);

        this.eventBus.off(
            BRIDGE_EVENT.OFFICER_TASK_CANCEL_SELECTED,
            this.handleOfficerTaskCancelSelected,
            this,
        );

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);

        this.eventBus.off(
            BRIDGE_EVENT
                .ENCOUNTER_TRAVEL_FLIGHT_STARTED,

            this.handleEncounterTravelFlightStarted,
            this,
        );

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, this.handleEncounterTravelCompleted, this);

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_JUMP_COMPLETED, this.handleEncounterJumpCompleted, this);

        this.eventBus.off(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED, this.handleDockingAnimationCompleted, this);

        this.eventBus.off(
            BRIDGE_EVENT
                .ENEMY_SHIP_DESTRUCTION_COMPLETED,

            this.handleEnemyShipDestructionCompleted,
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

        const node = run.universe.nodes.find((candidate) => {
            return candidate.id === location.nodeId;
        });

        if (!node) {
            throw new Error(`Space node not found: ${location.nodeId}`);
        }

        this.encounterEngine = new EncounterEngine({
            node,
            navigation: location.navigation,

            playerHull: {
                hull:
                    run.player.ship.hull,

                maxHull:
                    run.player.ship
                        .maxHull,
            },

            drive: run.player.ship.drive,

            pointDefense: run.player.ship.pointDefense,

            defenseCapacitor:
                run.player.ship
                    .defenseCapacitor,

            weapons: run.player.ship.weapons,

            completeTimedTasksImmediately: DEBUG_SETTINGS.bridge.officerTasks.completeTimedTasksImmediately,
        });

        this.snapshotSynchronizer = new BridgeEncounterSnapshotSynchronizer(
            this.encounterEngine,
            this.eventBus,
            GAME_RUNTIME,
        );

        this.officerCommandMenuController =
            new BridgeOfficerCommandMenuController(
                this.encounterEngine,
                this.eventBus,
            );

        this.officerStationsController = new BridgeOfficerStationsController(this.encounterEngine, this.eventBus);

        this.drainEncounterEvents();
        this.snapshotSynchronizer.syncInitial();

        if (this.isEncounterInteractive) {
            this.engageHostileActors();
            this.officerStationsController.sync();
        }
    }

    // #endregion

    // #region Officer command input

    private handleOfficerStationClicked(payload: BridgeOfficerStationClickedPayload): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        this.officerCommandMenuController?.open(payload.role);
    }

    private handleOfficerCommandMenuRefreshRequested(payload: BridgeOfficerCommandMenuRefreshRequestedPayload): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        this.officerCommandMenuController?.open(payload.role);
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

    private handleOfficerTaskCancelSelected(
        payload: BridgeOfficerTaskCancelSelectedPayload,
    ): void {
        if (!this.isEncounterInteractive || !this.encounterEngine) {
            return;
        }

        this.encounterEngine.cancelTask(payload.taskId);

        // cancelTask mutates engine state synchronously and queues
        // OFFICER_TASK_ENDED / task-specific presentation events.
        this.drainEncounterEvents();
        this.snapshotSynchronizer?.syncPlayerShipDashboard();
        this.officerStationsController?.sync();
    }

    // #endregion

    // #region Encounter presentation callbacks

    private handleEncounterArrivalCompleted(): void {
        this.completeEncounterArrival();

        this.isEncounterInteractive = true;

        this.engageHostileActors();
        this.officerStationsController?.sync();
    }

    private handleEncounterTravelFlightStarted(): void {
        this.engineEventHandler
            .clearCombatPresentation();
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

        this.encounterEngine.completeJump(payload.taskId);

        this.drainEncounterEvents();

        GAME_RUNTIME.jumpPlayerToNode(payload.targetNodeId);

        this.eventBus.emit(BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED, {
            sceneKey: SCENE_KEY.BRIDGE,
        });
    }

    private handleDockingAnimationCompleted(payload: BridgeDockingCompletedPayload): void {
        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.completeDocking(payload.taskId);

        this.drainEncounterEvents();

        this.eventBus.emit(BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED, {
            sceneKey: SCENE_KEY.END,
        });
    }

    private handleEnemyShipDestructionCompleted(
        _payload:
            BridgeEnemyShipDestructionPayload,
    ): void {
        this.isEncounterInteractive = true;

        this.officerStationsController
            ?.sync();
    }

    // #endregion

    // #region Engine events

    private drainEncounterEvents(): void {
        if (!this.encounterEngine) {
            return;
        }

        const events = this.encounterEngine.drainEvents();

        this.engineEventHandler.handle(events);
    }

    // #endregion

    // #region Officer command execution

    private executeCommand(payload: BridgeOfficerCommandSelectedPayload): ExecuteOfficerCommandResult | undefined {
        if (!this.encounterEngine) {
            return undefined;
        }

        const input = this.createExecuteCommandInput(payload);

        const result = this.encounterEngine.executeCommand(input);

        if (result.status === OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED) {
            this.snapshotSynchronizer?.syncPlayerShipDashboard();
            this.syncRuntimeNavigationFromEngine();
            this.drainEncounterEvents();
            this.snapshotSynchronizer?.syncLaserThreats();
            this.officerStationsController?.sync();
        }

        return result;
    }

    private createExecuteCommandInput(payload: BridgeOfficerCommandSelectedPayload): ExecuteOfficerCommandInput {
        let target = payload.target;

        // PLOT COURSE пока отображается общей командой без списка destinations.
        // Конкретный space node выбирает app-слой после клика игрока.
        if (payload.commandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE) {
            target = {
                kind: OFFICER_COMMAND_TARGET_KIND.SPACE_NODE,

                nodeId: this.getAutomaticPlotCourseTargetNodeId(),
            };
        }

        return {
            role: payload.role,
            commandId: payload.commandId,
            target,
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
                        const busyStations = result.busyRoles
                            .map((role) => {
                                return role.toUpperCase();
                            })
                            .join(', ');

                        this.eventBus.emit(BRIDGE_EVENT.OFFICER_BARK_REQUESTED, {
                            role: payload.role,

                            text: `CAN'T DO THAT, CAPTAIN. ` + `BUSY STATIONS: ${busyStations}.`,
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

    private engageHostileActors(): void {
        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.engageHostileActors();
        this.drainEncounterEvents();
    }

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

        this.encounterEngine.completeTravel(taskId);

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
            throw new Error(`Expected engine navigation ${expectedKind}, ` + `received ${navigation.kind}`);
        }

        GAME_RUNTIME.setPlayerSpaceNavigation(navigation);
    }

    // #endregion
}
