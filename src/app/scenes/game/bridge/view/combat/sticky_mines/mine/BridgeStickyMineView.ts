// src/app/scenes/game/bridge/view/combat/sticky_mines/mine/BridgeStickyMineView.ts

import {
    MINE_SPRITE_ID,
    MINE_SPRITES,
} from '../../../../../../../manifests/combat/mines/mine_sprite';
import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';
import {
    BRIDGE_STICKY_MINE_REMOVAL_OUTCOME,
    type BridgeStickyMineRemovalOutcome,
} from '../../../../events/bridge_event';

type BridgeStickyMineViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    startPosition: Phaser.Math.Vector2;
    targetPosition: Phaser.Math.Vector2;

    initialTimeToDetonationMs: number;
};

type BridgeStickyMineUpdate = {
    timeToDetonationMs: number;

    isBeingCleared: boolean;
    isNextClearTarget: boolean;
};

const STICKY_MINE_CRITICAL_FUSE_MS =
    2000;

const MINE_FRAME = {
    padding: 5,

    minHalfWidth: 42,
    minHalfHeight: 26,

    cornerLength: 8,
    thickness: 2,

    clearingInset: 4,

    labelGap: 3,
} as const;

const ATTACH_ANIMATION = {
    flightDurationMs: 140,
    settleDurationMs: 70,

    startScale: 0.2,
    impactScale: 1.12,
} as const;

// Leaf-view одной прикреплённой мины.
//
// Engine остаётся источником fuse и selection state.
// View только отображает snapshot.
export default class BridgeStickyMineView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly image:
        Phaser.GameObjects.Image;

    private readonly frame:
        Phaser.GameObjects.Graphics;

    private readonly fuseLabel:
        Phaser.GameObjects.BitmapText;

    private readonly scene: BridgeScene;

    private readonly parent:
        Phaser.GameObjects.Container;

    constructor({
        scene,
        parent,

        startPosition,
        targetPosition,

        initialTimeToDetonationMs,
    }: BridgeStickyMineViewOptions) {
        this.scene = scene;
        this.parent = parent;

        this.root =
            scene.add.container(
                startPosition.x,
                startPosition.y,
            );

        this.root
            .setScale(
                ATTACH_ANIMATION
                    .startScale,
            )
            .setAlpha(0.75);

        parent.add(this.root);

        const sprite =
            MINE_SPRITES[
                MINE_SPRITE_ID.STICKY_00
            ];

        this.image = scene.add.image(
            0,
            0,

            sprite.atlasKey,
            sprite.frameKey,
        );

        this.frame =
            scene.add.graphics();

        this.fuseLabel = scene.add
            .bitmapText(
                0,
                0,

                FONT_FAMILY.VGA_8X14,
                '',
                FONT_SIZE.PX_16,
            )
            .setOrigin(0.5, 0);

        this.root.add(this.image);
        this.root.add(this.frame);
        this.root.add(this.fuseLabel);

        this.update({
            timeToDetonationMs:
                initialTimeToDetonationMs,

            isBeingCleared: false,
            isNextClearTarget: false,
        });

        this.playAttachAnimation(
            targetPosition,
        );
    }

    public update({
        timeToDetonationMs,

        isBeingCleared,
        isNextClearTarget,
    }: BridgeStickyMineUpdate): void {
        const isCritical =
            timeToDetonationMs <=
            STICKY_MINE_CRITICAL_FUSE_MS;

        const color =
            this.getPresentationColor({
                isCritical,
                isBeingCleared,
                isNextClearTarget,
            });

        const alpha =
            this.getPresentationAlpha({
                isCritical,
                isNextClearTarget,
            });

        this.drawFrame(
            color,
            isBeingCleared,
        );

        this.frame.setAlpha(alpha);

        this.fuseLabel
            .setText(
                this.formatTimeToDetonation(
                    timeToDetonationMs,
                ),
            )
            .setTint(color)
            .setAlpha(alpha);

        this.image.setAlpha(
            isCritical &&
                alpha < 0.6
                ? 0.72
                : 1,
        );
    }

    public playRemovalEffect(
        outcome:
            BridgeStickyMineRemovalOutcome,
    ): void {
        switch (outcome) {
            case BRIDGE_STICKY_MINE_REMOVAL_OUTCOME
                .CLEARED:
                this.playClearEffect();
                return;

            case BRIDGE_STICKY_MINE_REMOVAL_OUTCOME
                .DETONATED:
                this.playDetonationEffect();
                return;

            default:
                return this.assertNever(
                    outcome,
                );
        }
    }

    public destroy(): void {
        this.scene.tweens.killTweensOf(
            this.root,
        );

        this.root.destroy(true);
    }

    private playAttachAnimation(
        targetPosition:
            Phaser.Math.Vector2,
    ): void {
        this.scene.tweens.add({
            targets: this.root,

            x: targetPosition.x,
            y: targetPosition.y,

            scaleX:
                ATTACH_ANIMATION
                    .impactScale,

            scaleY:
                ATTACH_ANIMATION
                    .impactScale,

            alpha: 1,

            duration:
                ATTACH_ANIMATION
                    .flightDurationMs,

            ease: 'Quad.In',

            onComplete: () => {
                this.scene.tweens.add({
                    targets: this.root,

                    scaleX: 1,
                    scaleY: 1,

                    duration:
                        ATTACH_ANIMATION
                            .settleDurationMs,

                    ease: 'Quad.Out',
                });
            },
        });
    }

    private playClearEffect(): void {
        const effect =
            this.scene.add.graphics({
                x: this.root.x,
                y: this.root.y,
            });

        this.parent.add(effect);

        effect.lineStyle(
            3,
            FONT_COLOR.PRIMARY,
            1,
        );

        effect.lineBetween(
            -48,
            0,
            48,
            0,
        );

        effect.setScale(0, 1);

        this.scene.tweens.add({
            targets: effect,

            scaleX: 1,

            duration: 100,
            ease: 'Quad.Out',

            onComplete: () => {
                this.scene.tweens.add({
                    targets: effect,

                    y: effect.y - 12,
                    alpha: 0,

                    duration: 140,
                    ease: 'Quad.In',

                    onComplete: () => {
                        effect.destroy();
                    },
                });
            },
        });
    }

    private playDetonationEffect(): void {
        const effect =
            this.scene.add.graphics({
                x: this.root.x,
                y: this.root.y,
            });

        this.parent.add(effect);

        effect.fillStyle(
            FONT_COLOR.DANGER,
            0.85,
        );

        effect.fillCircle(
            0,
            0,
            12,
        );

        effect.lineStyle(
            2,
            FONT_COLOR.WHITE,
            1,
        );

        effect.strokeCircle(
            0,
            0,
            9,
        );

        effect.setScale(0.5);

        this.scene.tweens.add({
            targets: effect,

            scaleX: 2.7,
            scaleY: 2.7,

            alpha: 0,

            duration: 220,
            ease: 'Quad.Out',

            onComplete: () => {
                effect.destroy();
            },
        });
    }

    private drawFrame(
        color: number,
        isBeingCleared: boolean,
    ): void {
        const halfWidth = Math.max(
            MINE_FRAME.minHalfWidth,

            Math.ceil(
                Math.abs(
                    this.image.displayWidth,
                ) / 2,
            ) + MINE_FRAME.padding,
        );

        const halfHeight = Math.max(
            MINE_FRAME.minHalfHeight,

            Math.ceil(
                Math.abs(
                    this.image.displayHeight,
                ) / 2,
            ) + MINE_FRAME.padding,
        );

        this.frame.clear();

        this.frame.fillStyle(
            color,
            1,
        );

        this.drawCornerFrame(
            halfWidth,
            halfHeight,
        );

        if (isBeingCleared) {
            this.drawCornerFrame(
                halfWidth -
                    MINE_FRAME
                        .clearingInset,

                halfHeight -
                    MINE_FRAME
                        .clearingInset,
            );
        }

        this.fuseLabel.setPosition(
            0,
            halfHeight +
                MINE_FRAME.labelGap,
        );
    }

    private drawCornerFrame(
        halfWidth: number,
        halfHeight: number,
    ): void {
        const left = -halfWidth;
        const right = halfWidth;

        const top = -halfHeight;
        const bottom = halfHeight;

        const length =
            MINE_FRAME.cornerLength;

        const thickness =
            MINE_FRAME.thickness;

        this.frame.fillRect(
            left,
            top,
            length,
            thickness,
        );

        this.frame.fillRect(
            left,
            top,
            thickness,
            length,
        );

        this.frame.fillRect(
            right - length,
            top,
            length,
            thickness,
        );

        this.frame.fillRect(
            right - thickness,
            top,
            thickness,
            length,
        );

        this.frame.fillRect(
            left,
            bottom - thickness,
            length,
            thickness,
        );

        this.frame.fillRect(
            left,
            bottom - length,
            thickness,
            length,
        );

        this.frame.fillRect(
            right - length,
            bottom - thickness,
            length,
            thickness,
        );

        this.frame.fillRect(
            right - thickness,
            bottom - length,
            thickness,
            length,
        );
    }

    private getPresentationColor({
        isCritical,
        isBeingCleared,
        isNextClearTarget,
    }: {
        isCritical: boolean;
        isBeingCleared: boolean;
        isNextClearTarget: boolean;
    }): number {
        if (isCritical) {
            return FONT_COLOR.DANGER;
        }

        if (isBeingCleared) {
            return FONT_COLOR.PRIMARY;
        }

        if (isNextClearTarget) {
            return FONT_COLOR.ACTIVITY;
        }

        return FONT_COLOR.SECONDARY;
    }

    private getPresentationAlpha({
        isCritical,
        isNextClearTarget,
    }: {
        isCritical: boolean;
        isNextClearTarget: boolean;
    }): number {
        if (isCritical) {
            return (
                Math.floor(
                    this.scene.time.now /
                        120,
                ) %
                    2 ===
                0
                    ? 1
                    : 0.35
            );
        }

        if (isNextClearTarget) {
            return (
                0.65 +
                0.35 *
                    (
                        Math.sin(
                            this.scene.time
                                .now /
                                130,
                        ) +
                        1
                    ) /
                    2
            );
        }

        return 1;
    }

    private formatTimeToDetonation(
        timeToDetonationMs: number,
    ): string {
        const remainingTenths =
            Math.max(
                0,
                Math.ceil(
                    timeToDetonationMs /
                        100,
                ),
            );

        const seconds =
            Math.floor(
                remainingTenths / 10,
            );

        const tenth =
            remainingTenths % 10;

        return (
            String(seconds)
                .padStart(2, '0') +
            ':' +
            String(tenth)
        );
    }

    private assertNever(
        value: never,
    ): never {
        throw new Error(
            `Unhandled sticky-mine removal outcome: ` +
                String(value),
        );
    }
}
