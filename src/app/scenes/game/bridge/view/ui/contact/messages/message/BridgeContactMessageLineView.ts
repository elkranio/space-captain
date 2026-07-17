// src/app/scenes/game/bridge/view/ui/contact/messages/message/BridgeContactMessageLineView.ts

import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../../../theme/font';
import type BridgeScene from '../../../../../BridgeScene';
import { BRIDGE_CONTACT_LAYOUT } from '../../bridge_contact_layout';

const SPEAKER_TEXT_GAP = 8;

export type BridgeContactMessageLineInput = {
    speakerName: string;
    text: string;
};

// Leaf-view одной строки contact message.
// Владеет speaker/text labels и локальной логикой отображения сообщения.
export default class BridgeContactMessageLineView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly speakerLabel: Phaser.GameObjects.BitmapText;
    private readonly textLabel: Phaser.GameObjects.BitmapText;

    constructor(
        private readonly scene: BridgeScene,
        input: BridgeContactMessageLineInput,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.speakerLabel = this.createSpeakerLabel(input.speakerName);

        const textX = this.speakerLabel.width + SPEAKER_TEXT_GAP;
        const textMaxWidth = Math.max(1, BRIDGE_CONTACT_LAYOUT.messages.width - textX);

        this.textLabel = this.createTextLabel(input.text, textX, textMaxWidth);

        this.alignSpeakerLabel();

        this.root.add([this.speakerLabel, this.textLabel]);
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public getHeight(): number {
        return Math.max(this.getLabelHeight(this.speakerLabel), this.getLabelHeight(this.textLabel));
    }

    private createSpeakerLabel(speakerName: string): Phaser.GameObjects.BitmapText {
        return this.scene.add
            .bitmapText(0, 0, FONT_FAMILY.VGA_8X14, `${speakerName.toUpperCase()}:`, FONT_SIZE.PX_16)
            .setOrigin(0, 1)
            .setTint(FONT_COLOR.SPEAKER);
    }

    private createTextLabel(text: string, x: number, maxWidth: number): Phaser.GameObjects.BitmapText {
        return this.scene.add
            .bitmapText(x, 0, FONT_FAMILY.VGA_8X14, text.toUpperCase(), FONT_SIZE.PX_16)
            .setOrigin(0, 1)
            .setMaxWidth(maxWidth)
            .setTint(FONT_COLOR.WHITE);
    }

    private alignSpeakerLabel(): void {
        const speakerHeight = this.getLabelHeight(this.speakerLabel);
        const textHeight = this.getLabelHeight(this.textLabel);

        this.speakerLabel.setY(-(textHeight - speakerHeight));
    }

    private getLabelHeight(label: Phaser.GameObjects.BitmapText): number {
        return label.getTextBounds(false).local.height;
    }
}
