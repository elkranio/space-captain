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

type BridgeStickyMineViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    x: number;
    y: number;

    initialTimeToDetonationMs: number;
};

const MINE_FRAME = {
    padding: 5,

    minHalfWidth: 42,
    minHalfHeight: 26,

    cornerLength: 8,
    thickness: 2,

    labelGap: 3,
} as const;

// Leaf-view одной прикреплённой мины.
//
// Engine остаётся источником fuse.
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

    constructor({
        scene,
        parent,

        x,
        y,

        initialTimeToDetonationMs,
    }: BridgeStickyMineViewOptions) {
        this.root =
            scene.add.container(x, y);

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
            .setOrigin(0.5, 0)
            .setTint(
                FONT_COLOR.ACTIVITY,
            );

        this.root.add(this.image);
        this.root.add(this.frame);
        this.root.add(this.fuseLabel);

        this.drawFrame();

        this.update(
            initialTimeToDetonationMs,
        );
    }

    public update(
        timeToDetonationMs: number,
    ): void {
        this.fuseLabel.setText(
            this.formatTimeToDetonation(
                timeToDetonationMs,
            ),
        );
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private drawFrame(): void {
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

        const left = -halfWidth;
        const right = halfWidth;

        const top = -halfHeight;
        const bottom = halfHeight;

        const length =
            MINE_FRAME.cornerLength;

        const thickness =
            MINE_FRAME.thickness;

        this.frame.clear();

        this.frame.fillStyle(
            FONT_COLOR.ACTIVITY,
            1,
        );

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

        this.fuseLabel.setPosition(
            0,
            bottom + MINE_FRAME.labelGap,
        );
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
}
