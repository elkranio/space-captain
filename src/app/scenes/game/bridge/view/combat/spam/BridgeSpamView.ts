// src/app/scenes/game/bridge/view/combat/spam/BridgeSpamView.ts

import { SPAM_CHANNEL_OUTCOME, type SpamChannelOutcome } from "../../../../../../../engine/encounter/model/combat";
import { SPAM_POPUP_SPRITES } from "../../../../../../manifests/bridge/combat_spam";
import type { SpriteEntry } from "../../../../../../manifests/types";
import type BridgeScene from "../../../BridgeScene";
import {
    BRIDGE_EVENT,
    type BridgeSpamChannelEndedPayload,
    type BridgeSpamChannelStartedPayload,
} from "../../../events/bridge_event";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import {
    BRIDGE_SPAM_LAYOUT_SLOTS,
    BRIDGE_SPAM_PRESENTATION,
    createSpamPopupPosition,
    takeRandomBagItem,
    type BridgeSpamLayoutSlot,
} from "./bridge_spam_layout";
import BridgeSpamPopupView from "./popup/BridgeSpamPopupView";

// Root-view hostile spam projection.
//
// Engine остаётся источником active channel lifecycle.
// View отвечает только за:
// - shuffled popup/position bags;
// - spawn cadence;
// - bounded popup count;
// - projection alpha/flicker;
// - visual close sequence.
export default class BridgeSpamView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly activeChannelIds = new Set<string>();

    private readonly visiblePopups: BridgeSpamPopupView[] = [];
    private readonly popupViews = new Set<BridgeSpamPopupView>();

    private readonly spriteBag: SpriteEntry[] = [];
    private readonly layoutSlotBag: BridgeSpamLayoutSlot[] = [];

    private spawnElapsedMs = 0;
    private nextSpawnDelayMs = 0;

    private flickerElapsedMs = 0;

    // Delayed callbacks старой close sequence
    // становятся no-op после изменения token.
    private closeSequenceId = 0;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0).setAlpha(BRIDGE_SPAM_PRESENTATION.baseAlpha);

        // Самый верхний слой внутри viewscreen:
        // поверх space/combat VFX, под bridge interior и UI.
        this.scene.layers.get("projection").add(this.root);

        this.eventBus.on(BRIDGE_EVENT.SPAM_CHANNEL_STARTED, this.handleSpamChannelStarted, this);

        this.eventBus.on(BRIDGE_EVENT.SPAM_CHANNEL_ENDED, this.handleSpamChannelEnded, this);

        this.eventBus.on(
            BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_STARTED,

            this.clearImmediately,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.ENCOUNTER_TRAVEL_FLIGHT_STARTED,

            this.clearImmediately,
            this,
        );

        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.SPAM_CHANNEL_STARTED, this.handleSpamChannelStarted, this);

        this.eventBus.off(BRIDGE_EVENT.SPAM_CHANNEL_ENDED, this.handleSpamChannelEnded, this);

        this.eventBus.off(
            BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_STARTED,

            this.clearImmediately,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.ENCOUNTER_TRAVEL_FLIGHT_STARTED,

            this.clearImmediately,
            this,
        );

        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);

        this.closeSequenceId += 1;

        this.activeChannelIds.clear();
        this.visiblePopups.length = 0;

        for (const popup of this.popupViews) {
            popup.destroy();
        }

        this.popupViews.clear();

        this.root.destroy(false);
    }

    private handleSpamChannelStarted(payload: BridgeSpamChannelStartedPayload): void {
        if (this.activeChannelIds.has(payload.channelId)) {
            throw new Error(`Spam channel already displayed: ${payload.channelId}`);
        }

        const wasInactive = this.activeChannelIds.size === 0;

        this.activeChannelIds.add(payload.channelId);

        if (!wasInactive) {
            return;
        }

        // Отменяет ещё не сработавшие callbacks
        // предыдущего expired/purged close sequence.
        this.closeSequenceId += 1;

        this.spawnElapsedMs = 0;
        this.nextSpawnDelayMs = this.createSpawnDelayMs();

        this.spawnPopup();
    }

    private handleSpamChannelEnded(payload: BridgeSpamChannelEndedPayload): void {
        if (!this.activeChannelIds.delete(payload.channelId)) {
            throw new Error(`Displayed spam channel not found: ${payload.channelId}`);
        }

        if (this.activeChannelIds.size > 0) {
            return;
        }

        this.spawnElapsedMs = 0;

        this.closeAllPopups(payload.outcome);
    }

    private clearImmediately(): void {
        this.closeSequenceId += 1;

        this.activeChannelIds.clear();

        this.spawnElapsedMs = 0;
        this.nextSpawnDelayMs = 0;

        this.visiblePopups.length = 0;

        for (const popup of this.popupViews) {
            popup.destroy();
        }

        this.popupViews.clear();
    }

    private handleSceneUpdate(_time: number, deltaMs: number): void {
        this.updateProjectionFlicker(deltaMs);

        if (this.activeChannelIds.size === 0) {
            return;
        }

        this.spawnElapsedMs += deltaMs;

        if (this.spawnElapsedMs < this.nextSpawnDelayMs) {
            return;
        }

        // После tab throttling не создаём пачку окон в один frame.
        this.spawnElapsedMs = 0;
        this.nextSpawnDelayMs = this.createSpawnDelayMs();

        this.spawnPopup();
    }

    private spawnPopup(): void {
        if (this.visiblePopups.length >= BRIDGE_SPAM_PRESENTATION.maxVisible) {
            const oldestPopup = this.visiblePopups[0];

            if (!oldestPopup) {
                throw new Error("Oldest spam popup was not found");
            }

            this.closePopup(oldestPopup);
        }

        const sprite = takeRandomBagItem(SPAM_POPUP_SPRITES, this.spriteBag);

        const slot = takeRandomBagItem(BRIDGE_SPAM_LAYOUT_SLOTS, this.layoutSlotBag);

        const popup = new BridgeSpamPopupView({
            scene: this.scene,
            parent: this.root,

            sprite,
            position: createSpamPopupPosition(slot),
        });

        this.visiblePopups.push(popup);
        this.popupViews.add(popup);

        popup.show();
    }

    private closeAllPopups(outcome: SpamChannelOutcome): void {
        const popups =
            outcome === SPAM_CHANNEL_OUTCOME.PURGED ? [...this.visiblePopups].reverse() : [...this.visiblePopups];

        const staggerMs =
            outcome === SPAM_CHANNEL_OUTCOME.PURGED
                ? BRIDGE_SPAM_PRESENTATION.purgeCloseStaggerMs
                : BRIDGE_SPAM_PRESENTATION.expiredCloseStaggerMs;

        const sequenceId = ++this.closeSequenceId;

        popups.forEach((popup, index) => {
            const delayMs = index * staggerMs;

            if (delayMs === 0) {
                this.closePopup(popup);
                return;
            }

            this.scene.time.delayedCall(
                delayMs,

                () => {
                    if (sequenceId !== this.closeSequenceId) {
                        return;
                    }

                    this.closePopup(popup);
                },
            );
        });
    }

    private closePopup(popup: BridgeSpamPopupView): void {
        const index = this.visiblePopups.indexOf(popup);

        if (index < 0) {
            return;
        }

        this.visiblePopups.splice(index, 1);

        popup.hide(() => {
            this.popupViews.delete(popup);
        });
    }

    private updateProjectionFlicker(deltaMs: number): void {
        if (this.popupViews.size === 0) {
            this.flickerElapsedMs = 0;

            this.root.setAlpha(BRIDGE_SPAM_PRESENTATION.baseAlpha);

            return;
        }

        this.flickerElapsedMs += deltaMs;

        if (this.flickerElapsedMs < BRIDGE_SPAM_PRESENTATION.flickerFrameMs) {
            return;
        }

        this.flickerElapsedMs %= BRIDGE_SPAM_PRESENTATION.flickerFrameMs;

        this.root.setAlpha(
            Phaser.Math.Clamp(
                BRIDGE_SPAM_PRESENTATION.baseAlpha +
                    Phaser.Math.FloatBetween(
                        -BRIDGE_SPAM_PRESENTATION.flickerAmplitude,
                        BRIDGE_SPAM_PRESENTATION.flickerAmplitude,
                    ),
                0,
                1,
            ),
        );
    }

    private createSpawnDelayMs(): number {
        return Phaser.Math.Between(BRIDGE_SPAM_PRESENTATION.spawnDelayMinMs, BRIDGE_SPAM_PRESENTATION.spawnDelayMaxMs);
    }
}
