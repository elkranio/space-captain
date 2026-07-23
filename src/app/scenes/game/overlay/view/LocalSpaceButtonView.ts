// src/app/scenes/game/overlay/view/LocalSpaceButtonView.ts

import { UI_BUTTON_SPRITE_ID, UI_BUTTON_SPRITES } from '../../../../manifests/ui/button';
import type GameOverlayEventBus from '../events/GameOverlayEventBus';
import { GAME_OVERLAY_EVENT } from '../events/game_overlay_event';
import type GameOverlayScene from '../GameOverlayScene';

const BUTTON_X = 640;
const BUTTON_Y = 76;

const BUTTON_HIT_AREA_SIZE = 48;
const BUTTON_HIT_AREA_OFFSET = -8;

// Временная глобальная кнопка LOCAL SPACE.
//
// Позже её могут заменить разные bridge/station controls,
// но сама панель останется частью постоянного overlay.
export default class LocalSpaceButtonView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly buttonImage: Phaser.GameObjects.Image;

    constructor(
        private readonly scene: GameOverlayScene,
        private readonly eventBus: GameOverlayEventBus,
    ) {
        this.root = this.scene.add.container(BUTTON_X, BUTTON_Y);
        this.scene.layers.add('ui', this.root);

        const buttonSprite = UI_BUTTON_SPRITES[UI_BUTTON_SPRITE_ID.LOCAL_SPACE_00];

        this.buttonImage = this.scene.add
            .image(0, 0, buttonSprite.atlasKey, buttonSprite.frameKey)
            .setOrigin(0.5)
            .setInteractive({
                hitArea: new Phaser.Geom.Rectangle(
                    BUTTON_HIT_AREA_OFFSET,
                    BUTTON_HIT_AREA_OFFSET,
                    BUTTON_HIT_AREA_SIZE,
                    BUTTON_HIT_AREA_SIZE,
                ),
                hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                useHandCursor: true,
            });

        this.buttonImage.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);

        this.root.add(this.buttonImage);
    }

    public destroy(): void {
        this.buttonImage.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
        this.root.destroy(true);
    }

    private handlePointerUp(): void {
        this.eventBus.emit(GAME_OVERLAY_EVENT.LOCAL_SPACE_BUTTON_CLICKED);
    }
}
