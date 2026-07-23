// src/app/scenes/game/overlay/view/LocalSpaceButtonView.ts

import { UI_BUTTON_SPRITE_ID, UI_BUTTON_SPRITES } from '../../../../manifests/ui/button';
import type GameOverlayScene from '../GameOverlayScene';

const BUTTON_X = 640;
const BUTTON_Y = 76;

// Временная глобальная кнопка LOCAL SPACE.
//
// Позже её могут заменить разные bridge/station controls,
// но сама панель останется частью постоянного overlay.
export default class LocalSpaceButtonView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly buttonImage: Phaser.GameObjects.Image;

    constructor(private readonly scene: GameOverlayScene) {
        this.root = this.scene.add.container(BUTTON_X, BUTTON_Y);
        this.scene.layers.add('ui', this.root);

        const buttonSprite = UI_BUTTON_SPRITES[UI_BUTTON_SPRITE_ID.LOCAL_SPACE_00];

        this.buttonImage = this.scene.add.image(0, 0, buttonSprite.atlasKey, buttonSprite.frameKey).setOrigin(0.5);

        this.root.add(this.buttonImage);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
