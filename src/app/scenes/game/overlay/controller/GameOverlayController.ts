// src/app/scenes/game/overlay/controller/GameOverlayController.ts

import type GameOverlayScene from '../GameOverlayScene';
import LocalSpaceButtonView from '../view/LocalSpaceButtonView';

// Root-controller постоянного game overlay.
//
// Пока только собирает overlay views.
// Input и открытие LOCAL SPACE добавим отдельным атомом.
export default class GameOverlayController {
    private localSpaceButtonView?: LocalSpaceButtonView;

    constructor(private readonly scene: GameOverlayScene) {}

    public prepare(): void {
        this.localSpaceButtonView = new LocalSpaceButtonView(this.scene);
    }

    public destroy(): void {
        this.localSpaceButtonView?.destroy();
        this.localSpaceButtonView = undefined;
    }
}
