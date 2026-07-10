// src\app\scenes\game\bridge\view\crew\seat\label\BridgeSeatLabelView.ts

import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

export default class BridgeSeatLabelView {
    private readonly text: Phaser.GameObjects.BitmapText;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        y: number,
        text: string,
    ) {
        this.text = this.scene.add
            .bitmapText(0, y, FONT_FAMILY.PIXEL_OPERATOR, text, FONT_SIZE.PX_18)
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
