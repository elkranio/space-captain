// src/app/scenes/game/bridge/view/barks/queue/BridgeOfficerBarkQueueView.ts

import type BridgeScene from '../../../BridgeScene';
import { UI_EVENT } from '../../ui/ui_event';
import BridgeOfficerBarkBubbleView from '../bubble/BridgeOfficerBarkBubbleView';
import type { OfficerBarkPosition } from '../bridge_officer_bark_layout';

const BARK_DURATION_MS = 2500;

// Per-officer view/controller одного bark slot-а.
// Держит bubble, очередь сообщений и timer текущего bark-а.
export default class BridgeOfficerBarkQueueView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly bubbleView: BridgeOfficerBarkBubbleView;

    private readonly queue: string[] = [];

    private hideTimer?: Phaser.Time.TimerEvent;
    private isShowing = false;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        private readonly position: OfficerBarkPosition,
    ) {
        this.root = this.scene.add.container(position.x, position.y);
        parent.add(this.root);

        this.bubbleView = new BridgeOfficerBarkBubbleView(this.scene);
        this.root.add(this.bubbleView.getRoot());

        this.bubbleView.getRoot().on(UI_EVENT.CLICK, this.handleBubbleClicked, this);
    }

    public destroy(): void {
        this.stopHideTimer();

        this.bubbleView.getRoot().off(UI_EVENT.CLICK, this.handleBubbleClicked, this);

        this.queue.length = 0;
        this.bubbleView.destroy();
        this.root.destroy(false);
    }

    public enqueue(text: string): void {
        if (this.isShowing) {
            this.queue.push(text);
            return;
        }

        this.showBark(text);
    }

    private showBark(text: string): void {
        this.isShowing = true;

        this.bubbleView.show(text, this.position.side);
        this.startHideTimer();
    }

    private handleBubbleClicked(): void {
        this.stopHideTimer();
        this.hideCurrentAndShowNext();
    }

    private handleDisplayTimeEnded(): void {
        this.hideTimer = undefined;
        this.hideCurrentAndShowNext();
    }

    private hideCurrentAndShowNext(): void {
        this.bubbleView.hide();

        const nextText = this.queue.shift();

        if (!nextText) {
            this.isShowing = false;
            return;
        }

        this.showBark(nextText);
    }

    private startHideTimer(): void {
        this.stopHideTimer();

        this.hideTimer = this.scene.time.addEvent({
            delay: BARK_DURATION_MS,
            callback: this.handleDisplayTimeEnded,
            callbackScope: this,
        });
    }

    private stopHideTimer(): void {
        this.hideTimer?.remove(false);
        this.hideTimer = undefined;
    }
}
