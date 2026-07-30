// src/app/scenes/game/bridge/controller/BridgeController.ts

import { GAME_RUNTIME } from '../../../../runtime/GameRuntime';
import { SCENE_RUNTIME } from '../../../../runtime/SceneRuntime';
import type BridgeScene from '../BridgeScene';
import BridgeEventBus from '../events/BridgeEventBus';
import { BRIDGE_EVENT, type BridgeSceneTransitionRequestedPayload } from '../events/bridge_event';
import BridgeView from '../view/BridgeView';
import BridgeEncounterController from './encounter/BridgeEncounterController';

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

    // Загружает bridge-level snapshots
    // из runtime и отдаёт их view
    // через scene-local event bus.
    private loadState(): void {
        const run = GAME_RUNTIME.getCurrentRun();

        this.eventBus.emit(BRIDGE_EVENT.CREW_LOADED, run.officers);

        this.eventBus.emit(
            BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,

            {
                hull: {
                    current: run.player.ship.hull,

                    max: run.player.ship.maxHull,
                },

                pointDefense: {
                    current: run.player.ship.pointDefense.charges,

                    max: run.player.ship.pointDefense.maxCharges,
                },

                shieldGenerator: {
                    current: run.player.ship.shieldGenerator.charges,

                    max: run.player.ship.shieldGenerator.maxCharges,
                },
            },
        );
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
        SCENE_RUNTIME.startGameScene(
            this.scene,
            payload.sceneKey,
        );
    }

    // #endregion
}
