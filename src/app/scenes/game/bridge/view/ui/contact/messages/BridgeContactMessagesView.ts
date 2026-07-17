// src/app/scenes/game/bridge/view/ui/contact/BridgeContactMessagesView.ts

import type BridgeScene from '../../../../BridgeScene';
import { BRIDGE_CONTACT_LAYOUT } from '../bridge_contact_layout';
import BridgeContactMessageLineView from './message/BridgeContactMessageLineView';

// Container-view списка contact messages.
// Управляет порядком, overflow и layout сообщений, но не знает детали отрисовки одной строки.
export default class BridgeContactMessagesView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly messages: BridgeContactMessageLineView[] = [];

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
    }

    public destroy(): void {
        this.clear();
        this.root.destroy(false);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public clear(): void {
        for (const message of this.messages) {
            message.destroy();
        }

        this.messages.length = 0;
    }

    public addMessage(speakerName: string, text: string): void {
        const message = new BridgeContactMessageLineView(this.scene, {
            speakerName,
            text,
        });

        this.root.add(message.getRoot());
        this.messages.push(message);

        this.removeOverflow();
        this.layoutMessages();
    }

    private layoutMessages(): void {
        let cursorY = BRIDGE_CONTACT_LAYOUT.messages.height;

        for (let index = this.messages.length - 1; index >= 0; index -= 1) {
            const message = this.messages[index];

            message.setPosition(0, cursorY);
            cursorY -= message.getHeight() + BRIDGE_CONTACT_LAYOUT.messages.gap;
        }
    }

    private removeOverflow(): void {
        while (this.messages.length > 1 && this.getTotalMessagesHeight() > BRIDGE_CONTACT_LAYOUT.messages.height) {
            const oldestMessage = this.messages.shift();
            oldestMessage?.destroy();
        }
    }

    private getTotalMessagesHeight(): number {
        if (this.messages.length === 0) {
            return 0;
        }

        const messagesHeight = this.messages.reduce((total, message) => {
            return total + message.getHeight();
        }, 0);

        const gapsHeight = (this.messages.length - 1) * BRIDGE_CONTACT_LAYOUT.messages.gap;

        return messagesHeight + gapsHeight;
    }
}
