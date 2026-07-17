// src/app/scenes/game/bridge/view/crew/seat/label/BridgeSeatLabelView.ts

import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

// Leaf-view label-плашки officer seat.
// Отвечает только за BitmapText внутри parent seat container.
export default class BridgeSeatLabelView {
    private readonly text: Phaser.GameObjects.BitmapText;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        labelY: number,
        text: string,
    ) {
        this.text = this.scene.add
            .bitmapText(0, labelY, FONT_FAMILY.VGA_8X14, text, FONT_SIZE.PX_16)
            .setOrigin(0.5, 0.5)
            .setTint(FONT_COLOR.PRIMARY);

        parent.add(this.text);
    }

    public setText(text: string): void {
        this.text.setText(text);
    }

    public destroy(): void {
        this.text.destroy();
    }
}
