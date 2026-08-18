// src/app/scenes/game/bridge/controller/BridgeController.ts

import { SCENE_RUNTIME } from "../../../../runtime/SceneRuntime";
import type BridgeScene from "../BridgeScene";
import BridgeEventBus from "../events/BridgeEventBus";
import { BRIDGE_EVENT, type BridgeSceneTransitionRequestedPayload } from "../events/bridge_event";
import BridgeView from "../view/BridgeView";
import BridgeEncounterController from "./encounter/BridgeEncounterController";

// Root-controller bridge scene.
//
// Собирает view/controller-модули сцены
// и держит scene-local event bus.
//
// Не содержит domain rules:
// gameplay-логику выполняют
// engine/controller-модули ниже.
export default class BridgeController {
    // #region Fields

    private readonly eventBus = new BridgeEventBus();

    private readonly view: BridgeView;

    private readonly encounterController: BridgeEncounterController;

    // #endregion

    // #region Lifecycle

    constructor(private readonly scene: BridgeScene) {
        this.registerBridgeEventHandlers();

        this.view = new BridgeView(this.scene, this.eventBus);

        this.encounterController = new BridgeEncounterController(this.eventBus);
    }

    public destroy(): void {
        this.unregisterBridgeEventHandlers();

        this.encounterController.destroy();

        this.view.destroy();

        this.eventBus.destroy();
    }

    // #endregion

    // #region Scene update

    public step(deltaMs: number): void {
        this.encounterController.step(deltaMs);
    }

    // #endregion

    // #region Bridge events

    private registerBridgeEventHandlers(): void {
        this.eventBus.on(
            BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED,

            this.handleSceneTransitionRequested,
            this,
        );
    }

    private unregisterBridgeEventHandlers(): void {
        this.eventBus.off(
            BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED,

            this.handleSceneTransitionRequested,
            this,
        );
    }

    // Выполняет scene transition,
    // запрошенный bridge-level flow.
    private handleSceneTransitionRequested(payload: BridgeSceneTransitionRequestedPayload): void {
        SCENE_RUNTIME.startGameScene(this.scene, payload.sceneKey);
    }

    // #endregion
}
