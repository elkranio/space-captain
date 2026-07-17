// src/app/scenes/game/bridge/view/ui/contact/BridgeContactView.ts

import { CONTACT_PANEL_SPRITE_ID, CONTACT_PANEL_SPRITES } from '../../../../../../manifests/ui/contact_panel';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeContactMessageAddedPayload,
    type BridgeContactStartedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import BridgeContactMessagesView from './messages/BridgeContactMessagesView';
import BridgeContactPortraitView from './portrait/BridgeContactPortraitView';
import { BRIDGE_CONTACT_LAYOUT } from './bridge_contact_layout';

// Composite-view contact panel.
// Показывает текущий comms contact, но не блокирует bridge целиком.
export default class BridgeContactView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly portraitView: BridgeContactPortraitView;
    private readonly messagesView: BridgeContactMessagesView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add
            .container(BRIDGE_CONTACT_LAYOUT.panel.x, BRIDGE_CONTACT_LAYOUT.panel.y)
            .setVisible(false);

        this.scene.layers.get('ui').add(this.root);

        this.createPanelBackground();

        this.portraitView = new BridgeContactPortraitView(this.scene);
        this.portraitView.setPosition(BRIDGE_CONTACT_LAYOUT.portrait.x, BRIDGE_CONTACT_LAYOUT.portrait.y);

        this.messagesView = new BridgeContactMessagesView(this.scene);
        this.messagesView.setPosition(BRIDGE_CONTACT_LAYOUT.messages.x, BRIDGE_CONTACT_LAYOUT.messages.y);

        this.root.add([this.portraitView.getRoot(), this.messagesView.getRoot()]);

        this.eventBus.on(BRIDGE_EVENT.CONTACT_STARTED, this.handleContactStarted, this);
        this.eventBus.on(BRIDGE_EVENT.CONTACT_MESSAGE_ADDED, this.handleContactMessageAdded, this);
        this.eventBus.on(BRIDGE_EVENT.CONTACT_ENDED, this.handleContactEnded, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.CONTACT_STARTED, this.handleContactStarted, this);
        this.eventBus.off(BRIDGE_EVENT.CONTACT_MESSAGE_ADDED, this.handleContactMessageAdded, this);
        this.eventBus.off(BRIDGE_EVENT.CONTACT_ENDED, this.handleContactEnded, this);

        this.portraitView.destroy();
        this.messagesView.destroy();
        this.root.destroy(false);
    }

    private handleContactStarted(payload: BridgeContactStartedPayload): void {
        this.messagesView.clear();
        this.portraitView.render(payload.contactName, payload.contactPortraitId);
        this.open();
    }

    private handleContactMessageAdded(payload: BridgeContactMessageAddedPayload): void {
        this.messagesView.addMessage(payload.speakerName, payload.text);
    }

    private handleContactEnded(): void {
        this.close();
    }

    private createPanelBackground(): void {
        const sprite = CONTACT_PANEL_SPRITES[CONTACT_PANEL_SPRITE_ID.PANEL_00];

        const background = this.scene.add
            .image(0, 0, sprite.atlasKey, sprite.frameKey)
            .setOrigin(0, 0)
            .setInteractive();

        this.root.add(background);
    }

    private open(): void {
        this.root.setVisible(true);
    }

    private close(): void {
        this.root.setVisible(false);
    }
}
