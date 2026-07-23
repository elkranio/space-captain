// src/app/scenes/game/bridge/controller/BridgeController.ts

import { GAME_RUNTIME } from '../../../../runtime/GameRuntime';
import { SCENE_RUNTIME } from '../../../../runtime/SceneRuntime';
import type BridgeScene from '../BridgeScene';
import BridgeEventBus from '../events/BridgeEventBus';
import { BRIDGE_EVENT, type BridgeSceneTransitionRequestedPayload } from '../events/bridge_event';
import BridgeView from '../view/BridgeView';
import BridgeEncounterController from './encounter/BridgeEncounterController';

// Root-controller bridge scene.
// Собирает view/controller-модули сцены и держит scene-local event bus.
// Не содержит domain rules: gameplay-логику выполняют engine/controller-модули ниже.
export default class BridgeController {
    // #region Fields

    private readonly eventBus = new BridgeEventBus();

    private view?: BridgeView;
    private encounterController?: BridgeEncounterController;

    // #endregion

    // #region Lifecycle

    constructor(private readonly scene: BridgeScene) {}

    public prepare(): void {
        this.registerBridgeEventHandlers();

        this.view = new BridgeView(this.scene, this.eventBus);
        this.view.prepare();

        this.loadState();

        this.encounterController = new BridgeEncounterController(this.eventBus);
        this.encounterController.prepare();
    }

    public destroy(): void {
        this.unregisterBridgeEventHandlers();

        this.encounterController?.destroy();
        this.encounterController = undefined;

        this.view?.destroy();
        this.view = undefined;

        this.eventBus.destroy();
    }

    // #endregion

    // #region Scene update

    public step(deltaMs: number): void {
        this.encounterController?.step(deltaMs);
    }

    // #endregion

    // #region Loading

    // Загружает bridge-level snapshot из runtime и отдаёт его во view через scene-local event bus.
    // Controller не хранит crew state у себя, чтобы root оставался только точкой сборки сцены.
    private loadState(): void {
        const run = GAME_RUNTIME.getCurrentRun();

        this.eventBus.emit(BRIDGE_EVENT.CREW_LOADED, run.officers);
    }

    // #endregion

    private registerBridgeEventHandlers(): void {
        this.eventBus.on(BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED, this.handleSceneTransitionRequested, this);
    }

    private unregisterBridgeEventHandlers(): void {
        this.eventBus.off(BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED, this.handleSceneTransitionRequested, this);
    }

    // Выполняет scene transition, запрошенный bridge-level flow.
    // Конкретный controller/request handler выбирает sceneKey,
    // а SceneRuntime управляет Phaser lifecycle и постоянным overlay.
    private handleSceneTransitionRequested(payload: BridgeSceneTransitionRequestedPayload): void {
        SCENE_RUNTIME.startGameScene(this.scene, payload.sceneKey);
    }
}
