// src/app/scenes/game/bridge/view/vfx/BridgeVfxView.ts

import type BridgeScene from "../../BridgeScene";
import { BRIDGE_EVENT, type BridgeEncounterJumpPayload } from "../../events/bridge_event";
import type BridgeEventBus from "../../events/BridgeEventBus";
import BridgeViewscreenDustView from "./viewscreen_dust/BridgeViewscreenDustView";

// Root view для bridge VFX layer.
// Собирает vfx child views и переводит bridge events
// в локальные visual effects.
export default class BridgeVfxView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly viewscreenDustView: BridgeViewscreenDustView;

    private readonly jumpFlash: Phaser.GameObjects.Rectangle;

    private jumpTween?: Phaser.Tweens.Tween;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get("vfx").add(this.root);

        this.viewscreenDustView = new BridgeViewscreenDustView(this.scene, this.root);

        // VFX layer расположен под bridge interior,
        // поэтому full-screen flash виден главным образом
        // через viewscreen.
        this.jumpFlash = this.scene.add
            .rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0xa8d8ff, 1)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setVisible(false)
            .setBlendMode(Phaser.BlendModes.ADD);

        this.root.add(this.jumpFlash);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.startViewscreenDust, this);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.stopViewscreenDust, this);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_TRAVEL_FLIGHT_STARTED, this.startViewscreenDust, this);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, this.stopViewscreenDust, this);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_JUMP_STARTED, this.playJump, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.startViewscreenDust, this);

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.stopViewscreenDust, this);

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_TRAVEL_FLIGHT_STARTED, this.startViewscreenDust, this);

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, this.stopViewscreenDust, this);

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_JUMP_STARTED, this.playJump, this);

        this.jumpTween?.stop();
        this.jumpTween = undefined;

        this.scene.tweens.killTweensOf(this.jumpFlash);

        this.viewscreenDustView.destroy();
        this.root.destroy(false);
    }

    private startViewscreenDust(): void {
        this.viewscreenDustView.start();
    }

    private stopViewscreenDust(): void {
        this.viewscreenDustView.stop();
    }

    private playJump(payload: BridgeEncounterJumpPayload): void {
        this.viewscreenDustView.stop();

        this.jumpTween?.stop();

        this.jumpFlash.setVisible(true).setAlpha(0);

        this.jumpTween = this.scene.tweens.add({
            targets: this.jumpFlash,
            alpha: 1,
            duration: 220,
            ease: "Linear",
            hold: 100,
            yoyo: true,

            onComplete: () => {
                this.jumpTween = undefined;

                this.jumpFlash.setVisible(false).setAlpha(0);

                this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_JUMP_COMPLETED, payload);
            },
        });
    }
}
