// src\app\scenes\game\bridge\view\crew\seat\label\BridgeSeatLabelView.ts
import type BridgeScene from '../../../../BridgeScene';

const FONT_KEY = 'pixel_operator' as const;
const FONT_SIZE = 18;
const TEXT_TINT = 0xd7e6ff;

export default class BridgeSeatLabelView {
    private readonly text: Phaser.GameObjects.BitmapText;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        y: number,
        text: string,
    ) {
        this.text = this.scene.add.bitmapText(0, y, FONT_KEY, text, FONT_SIZE).setOrigin(0.5, 0.5).setTint(TEXT_TINT);

        parent.add(this.text);
    }

    public setText(text: string): void {
        this.text.setText(text);
    }

    public destroy(): void {
        this.text.destroy();
    }
}
