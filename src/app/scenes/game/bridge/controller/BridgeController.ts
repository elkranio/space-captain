// src/app/scenes/game/bridge/controller/BridgeController.ts

import { GAME_RUNTIME } from '../../../../runtime/GameRuntime';
import type BridgeScene from '../BridgeScene';
import { BRIDGE_EVENT } from '../events/bridge_event';
import BridgeEventBus from '../events/BridgeEventBus';
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
        this.view = new BridgeView(this.scene, this.eventBus);
        this.view.prepare();

        this.loadState();

        this.encounterController = new BridgeEncounterController(this.scene, this.eventBus);
        this.encounterController.prepare();
    }

    public destroy(): void {
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
        const game = GAME_RUNTIME.getCurrentGame();

        this.eventBus.emit(BRIDGE_EVENT.CREW_LOADED, game.officers);
    }

    // #endregion
}
