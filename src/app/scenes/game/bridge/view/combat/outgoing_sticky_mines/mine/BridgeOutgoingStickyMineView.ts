// src/app/scenes/game/bridge/view/combat/outgoing_sticky_mines/mine/BridgeOutgoingStickyMineView.ts

import { MINE_SPRITE_ID, MINE_SPRITES } from "../../../../../../../manifests/combat/mines/mine_sprite";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";

type BridgeOutgoingStickyMineViewOptions = {
    scene: BridgeScene;

    parent: Phaser.GameObjects.Container;

    startPosition: Phaser.Math.Vector2;

    targetPosition: Phaser.Math.Vector2;

    initialTimeToDetonationMs: number;
};

const OUTGOING_STICKY_MINE_PRESENTATION = {
    flightDurationMs: 160,
    settleDurationMs: 80,

    startScale: 0.16,
    impactScale: 0.43,
    attachedScale: 0.36,

    labelY: 15,

    criticalFuseMs: 2000,
    criticalBlinkIntervalMs: 120,
} as const;

// One player sticky mine visually attaching
// to a stable point around an enemy actor.
//
// Engine owns attachment and fuse.
// The flight is presentation-only.
export default class BridgeOutgoingStickyMineView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly image: Phaser.GameObjects.Image;

    private readonly fuseLabel: Phaser.GameObjects.BitmapText;

    constructor({
        scene,
        parent,

        startPosition,
        targetPosition,

        initialTimeToDetonationMs,
    }: BridgeOutgoingStickyMineViewOptions) {
        this.scene = scene;
        this.parent = parent;

        this.root = scene.add.container(startPosition.x, startPosition.y);

        parent.add(this.root);

        const sprite = MINE_SPRITES[MINE_SPRITE_ID.STICKY_00];

        this.image = scene.add
            .image(
                0,
                0,

                sprite.atlasKey,
                sprite.frameKey,
            )
            .setScale(OUTGOING_STICKY_MINE_PRESENTATION.startScale);

        this.fuseLabel = scene.add
            .bitmapText(
                0,
                OUTGOING_STICKY_MINE_PRESENTATION.labelY,

                FONT_FAMILY.VGA_8X14,
                "",
                FONT_SIZE.PX_16,
            )
            .setOrigin(0.5, 0)
            .setAlpha(0);

        this.root.add(this.image);

        this.root.add(this.fuseLabel);

        this.update(initialTimeToDetonationMs);

        this.playAttachAnimation(targetPosition);
    }

    private readonly scene: BridgeScene;

    private readonly parent: Phaser.GameObjects.Container;

    public update(timeToDetonationMs: number): void {
        const isCritical = timeToDetonationMs <= OUTGOING_STICKY_MINE_PRESENTATION.criticalFuseMs;

        const alpha = isCritical ? this.getCriticalAlpha() : 1;

        const color = isCritical ? FONT_COLOR.DANGER : FONT_COLOR.ACTIVITY;

        this.fuseLabel
            .setText(this.formatTimeToDetonation(timeToDetonationMs))
            .setTint(color)
            .setAlpha(this.fuseLabel.alpha === 0 ? 0 : alpha);

        this.image.setAlpha(isCritical && alpha < 0.6 ? 0.7 : 1);
    }

    public playDetonationEffect(): void {
        const effect = this.scene.add.graphics({
            x: this.root.x,

            y: this.root.y,
        });

        this.parent.add(effect);

        effect.fillStyle(FONT_COLOR.DANGER, 0.9);

        effect.fillCircle(0, 0, 7);

        effect.lineStyle(2, FONT_COLOR.WHITE, 1);

        effect.strokeCircle(0, 0, 5);

        effect.setScale(0.5);

        this.scene.tweens.add({
            targets: effect,

            scaleX: 2.2,
            scaleY: 2.2,

            alpha: 0,

            duration: 180,
            ease: "Quad.Out",

            onComplete: () => {
                effect.destroy();
            },
        });
    }

    public destroy(): void {
        this.scene.tweens.killTweensOf(this.root);

        this.scene.tweens.killTweensOf(this.image);

        this.scene.tweens.killTweensOf(this.fuseLabel);

        this.root.destroy(true);
    }

    private playAttachAnimation(targetPosition: Phaser.Math.Vector2): void {
        this.scene.tweens.add({
            targets: this.root,

            x: targetPosition.x,

            y: targetPosition.y,

            duration: OUTGOING_STICKY_MINE_PRESENTATION.flightDurationMs,

            ease: "Quad.In",
        });

        this.scene.tweens.add({
            targets: this.image,

            scaleX: OUTGOING_STICKY_MINE_PRESENTATION.impactScale,

            scaleY: OUTGOING_STICKY_MINE_PRESENTATION.impactScale,

            duration: OUTGOING_STICKY_MINE_PRESENTATION.flightDurationMs,

            ease: "Quad.In",

            onComplete: () => {
                this.scene.tweens.add({
                    targets: this.image,

                    scaleX: OUTGOING_STICKY_MINE_PRESENTATION.attachedScale,

                    scaleY: OUTGOING_STICKY_MINE_PRESENTATION.attachedScale,

                    duration: OUTGOING_STICKY_MINE_PRESENTATION.settleDurationMs,

                    ease: "Quad.Out",
                });

                this.scene.tweens.add({
                    targets: this.fuseLabel,

                    alpha: 1,

                    duration: OUTGOING_STICKY_MINE_PRESENTATION.settleDurationMs,

                    ease: "Quad.Out",
                });
            },
        });
    }

    private getCriticalAlpha(): number {
        return Math.floor(this.scene.time.now / OUTGOING_STICKY_MINE_PRESENTATION.criticalBlinkIntervalMs) % 2 === 0
            ? 1
            : 0.35;
    }

    private formatTimeToDetonation(timeToDetonationMs: number): string {
        const remainingTenths = Math.max(0, Math.ceil(timeToDetonationMs / 100));

        const seconds = Math.floor(remainingTenths / 10);

        const tenth = remainingTenths % 10;

        return String(seconds).padStart(2, "0") + ":" + String(tenth);
    }
}
