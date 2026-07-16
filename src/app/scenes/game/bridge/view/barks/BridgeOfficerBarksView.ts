// src/app/scenes/game/bridge/view/barks/BridgeOfficerBarksView.ts

import type BridgeScene from '../../BridgeScene';
import { BRIDGE_EVENT, type BridgeOfficerBarkRequestedPayload } from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeOfficerBarkBubbleView from './BridgeOfficerBarkBubbleView';
import { OFFICER_BARK_POSITION_BY_ROLE } from './bridge_officer_bark_layout';

const BARK_DURATION_MS = 2500;

export default class BridgeOfficerBarksView {
    // #region Fields
    private readonly root: Phaser.GameObjects.Container;
    private readonly bubbleView: BridgeOfficerBarkBubbleView;

    private hideTimer?: Phaser.Time.TimerEvent;
    // #endregion

    // #region Lifecycle
    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('barks').add(this.root);

        this.bubbleView = new BridgeOfficerBarkBubbleView(this.scene);
        this.root.add(this.bubbleView.getRoot());

        this.eventBus.on(BRIDGE_EVENT.OFFICER_BARK_REQUESTED, this.handleOfficerBarkRequested, this);
    }

    public destroy(): void {
        this.stopHideTimer();

        this.eventBus.off(BRIDGE_EVENT.OFFICER_BARK_REQUESTED, this.handleOfficerBarkRequested, this);

        this.bubbleView.destroy();
        this.root.destroy(true);
    }
    // #endregion

    // #region Event handlers
    private handleOfficerBarkRequested(payload: BridgeOfficerBarkRequestedPayload): void {
        const position = OFFICER_BARK_POSITION_BY_ROLE[payload.role];

        this.stopHideTimer();

        this.bubbleView.setPosition(position.x, position.y);
        this.bubbleView.show(payload.text, position.side);

        this.hideTimer = this.scene.time.addEvent({
            delay: BARK_DURATION_MS,
            callback: () => {
                this.hideTimer = undefined;
                this.bubbleView.hide();
            },
        });
    }
    // #endregion

    // #region Timers
    private stopHideTimer(): void {
        this.hideTimer?.remove(false);
        this.hideTimer = undefined;
    }
    // #endregion
}
