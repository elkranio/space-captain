// src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts

import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
    type PlayerSpaceNavigationState,
} from "../../../../../../engine/defs/player_location";
import EncounterEngine from "../../../../../../engine/encounter/EncounterEngine";
import type { EncounterPresentationSnapshot } from "../../../../../../engine/encounter/snapshots/encounter_presentation_snapshot";
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
    type ExecuteOfficerCommandInput,
} from "../../../../../../engine/encounter/model/command";
import { BEAM_CANNON_SHOT_OUTCOME } from "../../../../../../engine/encounter/model/combat";
import { ENCOUNTER_EVENT, type EncounterEvent } from "../../../../../../engine/encounter/model/event";
import { applyEnemyCombatStartDebugBehaviors } from "../../../../../debug/apply_enemy_combat_start_debug_behaviors";
import { DEBUG_SETTINGS } from "../../../../../debug/debug_settings";
import { GAME_RUNTIME } from "../../../../../runtime/GameRuntime";
import { SCENE_KEY } from "../../../../scene_key";
import {
    BRIDGE_EVENT,
    type BridgeDockingCompletedPayload,
    type BridgeEncounterJumpPayload,
    type BridgeEncounterTravelCompletedPayload,
    type BridgeOfficerCommandSelectedPayload,
    type BridgeOfficerTaskCancelRequestedPayload,
} from "../../events/bridge_event";
import type BridgeEventBus from "../../events/BridgeEventBus";
import BridgeEncounterPersistenceSynchronizer from "./BridgeEncounterPersistenceSynchronizer";
import BridgeEncounterEngineEventHandler from "./engine_events/BridgeEncounterEngineEventHandler";
import BridgeEncounterSnapshotSynchronizer from "./snapshots/BridgeEncounterSnapshotSynchronizer";

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

    private readonly encounterEngine: EncounterEngine;

    private readonly snapshotSynchronizer: BridgeEncounterSnapshotSynchronizer;

    private readonly engineEventHandler: BridgeEncounterEngineEventHandler;

    private readonly persistenceSynchronizer: BridgeEncounterPersistenceSynchronizer;

    private isEncounterInteractive = false;

    private hasAppliedEnemyCombatStartDebugBehaviors = false;

    // #endregion

    constructor(private readonly eventBus: BridgeEventBus) {
        this.persistenceSynchronizer = new BridgeEncounterPersistenceSynchronizer(GAME_RUNTIME);

        this.engineEventHandler = new BridgeEncounterEngineEventHandler(this.eventBus);

        this.registerBridgeEventHandlers();

        this.encounterEngine = this.createEncounterEngine();

        const playerShip = GAME_RUNTIME.getCurrentRun().player.ship;

        this.snapshotSynchronizer = new BridgeEncounterSnapshotSynchronizer(
            this.eventBus,
            {
                chassisId: playerShip.chassisId,
                mounts: playerShip.mounts,
            },
        );

        this.presentInitialEncounterState();
    }

    // #region Lifecycle

    public destroy(): void {
        this.unregisterBridgeEventHandlers();
    }

    // #endregion

    // #region Scene update

    public step(deltaMs: number): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        this.encounterEngine.step(deltaMs);

        const presentationSnapshot = this.encounterEngine.getPresentationSnapshot();

        this.persistEncounterSnapshot(presentationSnapshot);

        this.snapshotSynchronizer.syncPlayerShipDashboard(presentationSnapshot);

        this.drainEncounterEvents();

        this.snapshotSynchronizer.syncCombatPresentation(presentationSnapshot);
    }

    // #endregion

    // #region Bridge event registration

    private registerBridgeEventHandlers(): void {
        this.eventBus.on(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);

        this.eventBus.on(BRIDGE_EVENT.OFFICER_TASK_CANCEL_REQUESTED, this.handleOfficerTaskCancelRequested, this);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);

        this.eventBus.on(
            BRIDGE_EVENT.ENCOUNTER_TRAVEL_FLIGHT_STARTED,

            this.handleEncounterTravelFlightStarted,
            this,
        );

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, this.handleEncounterTravelCompleted, this);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_JUMP_COMPLETED, this.handleEncounterJumpCompleted, this);

        this.eventBus.on(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED, this.handleDockingAnimationCompleted, this);
    }

    private unregisterBridgeEventHandlers(): void {
        this.eventBus.off(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);

        this.eventBus.off(BRIDGE_EVENT.OFFICER_TASK_CANCEL_REQUESTED, this.handleOfficerTaskCancelRequested, this);

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);

        this.eventBus.off(
            BRIDGE_EVENT.ENCOUNTER_TRAVEL_FLIGHT_STARTED,

            this.handleEncounterTravelFlightStarted,
            this,
        );

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, this.handleEncounterTravelCompleted, this);

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_JUMP_COMPLETED, this.handleEncounterJumpCompleted, this);

        this.eventBus.off(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED, this.handleDockingAnimationCompleted, this);
    }

    // #endregion

    // #region Encounter setup

    private createEncounterEngine(): EncounterEngine {
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

        return new EncounterEngine({
            node,
            navigation: location.navigation,

            playerHull: {
                hull: run.player.ship.hull,

                maxHull: run.player.ship.maxHull,
            },

            drive: run.player.ship.drive,

            defenseTurret: run.player.ship.defenseTurret,

            powerCore: run.player.ship.powerCore,

            shieldGenerator: run.player.ship.shieldGenerator,

            weapons: run.player.ship.weapons,

            completeTimedTasksImmediately: DEBUG_SETTINGS.bridge.officerTasks.completeTimedTasksImmediately,
        });
    }

    private presentInitialEncounterState(): void {
        const loadPresentationSnapshot = this.encounterEngine.getPresentationSnapshot();

        this.drainEncounterEvents(loadPresentationSnapshot);

        // Loaded presentation may synchronously restore/complete travel.
        // Persist and present one fresh coherent frame after those side effects.
        const initialPresentationSnapshot = this.encounterEngine.getPresentationSnapshot();

        this.persistEncounterSnapshot(initialPresentationSnapshot);

        this.snapshotSynchronizer.syncInitial(initialPresentationSnapshot);

        if (this.isEncounterInteractive) {
            this.handleEncounterBecameInteractive();
        }
    }

    // #endregion

    // #region Officer command input

    private handleOfficerCommandSelected(payload: BridgeOfficerCommandSelectedPayload): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        this.executeCommand(payload);
    }

    private handleOfficerTaskCancelRequested(payload: BridgeOfficerTaskCancelRequestedPayload): void {
        if (!this.isEncounterInteractive) {
            return;
        }

        this.encounterEngine.cancelTask(payload.taskId);

        const presentationSnapshot = this.encounterEngine.getPresentationSnapshot();

        this.persistEncounterSnapshot(presentationSnapshot);
        this.snapshotSynchronizer.syncPlayerShipDashboard(presentationSnapshot);

        this.drainEncounterEvents();

        this.snapshotSynchronizer.syncCombatPresentation(presentationSnapshot);
    }

    // #endregion

    // #region Encounter presentation callbacks

    private handleEncounterArrivalCompleted(): void {
        this.completeEncounterArrival();

        this.isEncounterInteractive = true;

        this.handleEncounterBecameInteractive();
    }

    private handleEncounterTravelFlightStarted(): void {
        this.engineEventHandler.clearCombatPresentation();
    }

    private handleEncounterTravelCompleted(payload: BridgeEncounterTravelCompletedPayload): void {
        this.completeEncounterTravel(payload.taskId);

        this.isEncounterInteractive = true;

        this.drainEncounterEvents();
    }

    private handleEncounterJumpCompleted(payload: BridgeEncounterJumpPayload): void {
        this.encounterEngine.completeJump(payload.taskId);

        this.drainEncounterEvents();

        GAME_RUNTIME.jumpPlayerToNode(payload.targetNodeId);

        this.eventBus.emit(BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED, {
            sceneKey: SCENE_KEY.BRIDGE,
        });
    }

    private handleDockingAnimationCompleted(payload: BridgeDockingCompletedPayload): void {
        this.encounterEngine.completeDocking(payload.taskId);

        this.drainEncounterEvents();

        this.eventBus.emit(BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED, {
            sceneKey: SCENE_KEY.END,
        });
    }

    // #endregion

    // #region Engine events

    private drainEncounterEvents(presentationSnapshot?: EncounterPresentationSnapshot): void {
        const events = this.encounterEngine.drainEvents();

        for (const event of events) {
            this.persistenceSynchronizer.syncEvent(event);

            const playerShipDestroyed = this.updateInteractionState(event, presentationSnapshot);

            this.engineEventHandler.handle(event, presentationSnapshot);

            if (playerShipDestroyed) {
                this.eventBus.emit(BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED, {
                    sceneKey: SCENE_KEY.END,
                });
            }
        }
    }

    private updateInteractionState(
        event: EncounterEvent,
        presentationSnapshot?: EncounterPresentationSnapshot,
    ): boolean {
        switch (event.type) {
            case ENCOUNTER_EVENT.ENCOUNTER_LOADED:
                if (!presentationSnapshot) {
                    throw new Error("ENCOUNTER_LOADED requires presentation snapshot");
                }

                this.isEncounterInteractive =
                    presentationSnapshot.navigation.kind === PLAYER_SPACE_NAVIGATION_KIND.ANCHORED;
                return false;

            case ENCOUNTER_EVENT.TRAVEL_STARTED:
            case ENCOUNTER_EVENT.JUMP_STARTED:
            case ENCOUNTER_EVENT.DOCKING_STARTED:
                this.isEncounterInteractive = false;
                return false;

            case ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP:
            case ENCOUNTER_EVENT.STICKY_MINE_DETONATED:
                if (!event.destroyed) {
                    return false;
                }

                this.isEncounterInteractive = false;
                return true;

            case ENCOUNTER_EVENT.BEAM_CANNON_FIRED:
                if (event.outcome !== BEAM_CANNON_SHOT_OUTCOME.HIT || !event.destroyed) {
                    return false;
                }

                this.isEncounterInteractive = false;
                return true;
        }

        return false;
    }

    // #endregion

    // #region Officer command execution

    private executeCommand(payload: BridgeOfficerCommandSelectedPayload): void {
        const input = this.createExecuteCommandInput(payload);

        const result = this.encounterEngine.executeCommand(input);

        if (result.status === OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED) {
            const presentationSnapshot = this.encounterEngine.getPresentationSnapshot();

            this.persistEncounterSnapshot(presentationSnapshot);

            this.snapshotSynchronizer.syncPlayerShipDashboard(presentationSnapshot);

            this.drainEncounterEvents();

            this.snapshotSynchronizer.syncBeamCannonThreats(presentationSnapshot);
        }

    }

    private createExecuteCommandInput(payload: BridgeOfficerCommandSelectedPayload): ExecuteOfficerCommandInput {
        let target = payload.target;

        // PLOT COURSE пока отображается общей командой без списка destinations.
        // Конкретный space node выбирает app-слой после клика игрока.
        if (payload.commandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PLOT_COURSE) {
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

    // #endregion

    // #region Encounter lifecycle

    private handleEncounterBecameInteractive(): void {
        if (!this.hasAppliedEnemyCombatStartDebugBehaviors) {
            applyEnemyCombatStartDebugBehaviors(this.encounterEngine);

            this.hasAppliedEnemyCombatStartDebugBehaviors = true;
        }

        this.drainEncounterEvents();
    }

    private completeEncounterArrival(): void {
        this.encounterEngine.completeArrival();

        const presentationSnapshot = this.encounterEngine.getPresentationSnapshot();

        this.persistEncounterSnapshot(
            presentationSnapshot,

            PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
        );
    }

    private completeEncounterTravel(taskId: string): void {
        this.encounterEngine.completeTravel(taskId);

        const presentationSnapshot = this.encounterEngine.getPresentationSnapshot();

        this.persistEncounterSnapshot(
            presentationSnapshot,

            PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
        );
    }

    // #endregion

    // #region Runtime synchronization

    private persistEncounterSnapshot(
        snapshot: EncounterPresentationSnapshot,

        expectedNavigationKind?: PlayerSpaceNavigationState["kind"],
    ): void {
        const navigation = snapshot.navigation;

        if (expectedNavigationKind !== undefined && navigation.kind !== expectedNavigationKind) {
            throw new Error(`Expected engine navigation ${expectedNavigationKind}, ` + `received ${navigation.kind}`);
        }

        this.persistenceSynchronizer.syncSnapshot(snapshot);
    }

    // #endregion
}
