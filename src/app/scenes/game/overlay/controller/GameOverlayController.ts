// src/app/scenes/game/overlay/controller/GameOverlayController.ts

import GameOverlayEventBus from '../events/GameOverlayEventBus';
import { GAME_OVERLAY_EVENT } from '../events/game_overlay_event';
import type GameOverlayScene from '../GameOverlayScene';
import LocalSpaceButtonView from '../view/LocalSpaceButtonView';
import LocalSpacePanelView from '../view/LocalSpacePanelView';

// Root-controller постоянного game overlay.
//
// Собирает overlay views и обрабатывает scene-local UI intents.
export default class GameOverlayController {
    private readonly eventBus = new GameOverlayEventBus();

    private localSpaceButtonView?: LocalSpaceButtonView;
    private localSpacePanelView?: LocalSpacePanelView;

    constructor(private readonly scene: GameOverlayScene) {}

    public prepare(): void {
        this.registerEventHandlers();

        this.localSpaceButtonView = new LocalSpaceButtonView(this.scene, this.eventBus);

        // Создаётся после кнопки, поэтому modal root находится выше неё
        // внутри overlay UI layer.
        this.localSpacePanelView = new LocalSpacePanelView(this.scene, this.eventBus);
    }

    public destroy(): void {
        this.unregisterEventHandlers();

        this.localSpacePanelView?.destroy();
        this.localSpacePanelView = undefined;

        this.localSpaceButtonView?.destroy();
        this.localSpaceButtonView = undefined;

        this.eventBus.destroy();
    }

    private registerEventHandlers(): void {
        this.eventBus.on(GAME_OVERLAY_EVENT.LOCAL_SPACE_BUTTON_CLICKED, this.handleLocalSpaceButtonClicked, this);

        this.eventBus.on(
            GAME_OVERLAY_EVENT.LOCAL_SPACE_PANEL_CLOSE_CLICKED,
            this.handleLocalSpacePanelCloseClicked,
            this,
        );
    }

    private unregisterEventHandlers(): void {
        this.eventBus.off(GAME_OVERLAY_EVENT.LOCAL_SPACE_BUTTON_CLICKED, this.handleLocalSpaceButtonClicked, this);

        this.eventBus.off(
            GAME_OVERLAY_EVENT.LOCAL_SPACE_PANEL_CLOSE_CLICKED,
            this.handleLocalSpacePanelCloseClicked,
            this,
        );
    }

    private handleLocalSpaceButtonClicked(): void {
        this.localSpacePanelView?.show();
    }

    private handleLocalSpacePanelCloseClicked(): void {
        this.localSpacePanelView?.hide();
    }
}
