// src/app/scenes/game/bridge/view/ui/contact/BridgeContactMessagesView.ts

import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../theme/font';
import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_CONTACT_LAYOUT } from './bridge_contact_layout';

type ContactMessageLineView = {
    root: Phaser.GameObjects.Container;
    speakerLabel: Phaser.GameObjects.BitmapText;
    textLabel: Phaser.GameObjects.BitmapText;
};

const SPEAKER_TEXT_GAP = 8;

export default class BridgeContactMessagesView {
    // #region Fields
    private readonly root: Phaser.GameObjects.Container;
    private readonly messages: ContactMessageLineView[] = [];
    // #endregion

    // #region Lifecycle
    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
    // #endregion

    // #region Public API
    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public clear(): void {
        this.root.removeAll(true);
        this.messages.length = 0;
    }

    public addMessage(speakerName: string, text: string): void {
        const message = this.createMessage(speakerName, text);

        this.root.add(message.root);
        this.messages.push(message);

        this.removeOverflow();
        this.layoutMessages();
    }
    // #endregion

    // #region Rendering
    private createMessage(speakerName: string, text: string): ContactMessageLineView {
        const root = this.scene.add.container(0, 0);

        const speakerLabel = this.scene.add
            .bitmapText(0, 0, FONT_FAMILY.VGA_8X14, `${speakerName.toUpperCase()}:`, FONT_SIZE.PX_16)
            .setOrigin(0, 1)
            .setTint(FONT_COLOR.SPEAKER);

        const textX = speakerLabel.width + SPEAKER_TEXT_GAP;
        const textMaxWidth = Math.max(1, BRIDGE_CONTACT_LAYOUT.messages.width - textX);

        const textLabel = this.scene.add
            .bitmapText(textX, 0, FONT_FAMILY.VGA_8X14, text.toUpperCase(), FONT_SIZE.PX_16)
            .setOrigin(0, 1)
            .setMaxWidth(textMaxWidth)
            .setTint(FONT_COLOR.WHITE);

        this.alignSpeakerLabel(speakerLabel, textLabel);

        root.add([speakerLabel, textLabel]);

        return {
            root,
            speakerLabel,
            textLabel,
        };
    }
    // #endregion

    // #region Layout
    private layoutMessages(): void {
        let cursorY = BRIDGE_CONTACT_LAYOUT.messages.height;

        for (let index = this.messages.length - 1; index >= 0; index -= 1) {
            const message = this.messages[index];
            const messageHeight = this.getMessageHeight(message);

            message.root.setPosition(0, cursorY);

            cursorY -= messageHeight + BRIDGE_CONTACT_LAYOUT.messages.gap;
        }
    }

    private removeOverflow(): void {
        while (this.messages.length > 1 && this.getTotalMessagesHeight() > BRIDGE_CONTACT_LAYOUT.messages.height) {
            const oldestMessage = this.messages.shift();
            oldestMessage?.root.destroy(true);
        }
    }

    private getTotalMessagesHeight(): number {
        if (this.messages.length === 0) {
            return 0;
        }

        const messagesHeight = this.messages.reduce((total, message) => {
            return total + this.getMessageHeight(message);
        }, 0);

        const gapsHeight = (this.messages.length - 1) * BRIDGE_CONTACT_LAYOUT.messages.gap;

        return messagesHeight + gapsHeight;
    }

    private getMessageHeight(message: ContactMessageLineView): number {
        return Math.max(
            message.speakerLabel.getTextBounds(false).local.height,
            message.textLabel.getTextBounds(false).local.height,
        );
    }

    private alignSpeakerLabel(
        speakerLabel: Phaser.GameObjects.BitmapText,
        textLabel: Phaser.GameObjects.BitmapText,
    ): void {
        const speakerHeight = this.getLabelHeight(speakerLabel);
        const textHeight = this.getLabelHeight(textLabel);

        speakerLabel.setY(-(textHeight - speakerHeight));
    }

    private getLabelHeight(label: Phaser.GameObjects.BitmapText): number {
        return label.getTextBounds(false).local.height;
    }
    // #endregion
}
