// src/app/scenes/game/bridge/view/combat/sticky_mines/mine/BridgeStickyMineMissView.ts

import { MINE_SPRITE_ID, MINE_SPRITES } from "../../../../../../../manifests/combat/mines/mine_sprite";
import type BridgeScene from "../../../../BridgeScene";
import { BRIDGE_VIEWSCREEN_RECT } from "../../../bridge_viewscreen_layout";

type BridgeStickyMineMissViewOptions = {
    scene: BridgeScene;

    parent: Phaser.GameObjects.Container;

    startPosition: Phaser.Math.Vector2;

    onComplete: () => void;
};

const MISS_FLIGHT = {
    durationMs: 220,

    startScale: 0.2,

    endScale: 1,

    overflowPx: 72,

    edgeInsetPx: 18,
} as const;

// One presentation-only sticky mine that failed to attach because of Evade.
//
// There is deliberately no runtime mine id, fuse or display slot behind this
// view. It starts at the enemy ship and simply continues past one random edge
// of the viewscreen before being destroyed.
export default class BridgeStickyMineMissView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly scene: BridgeScene;

    private completed = false;

    constructor({ scene, parent, startPosition, onComplete }: BridgeStickyMineMissViewOptions) {
        this.scene = scene;

        this.root = scene.add.container(startPosition.x, startPosition.y);

        this.root.setScale(MISS_FLIGHT.startScale).setAlpha(0.75);

        parent.add(this.root);

        const sprite = MINE_SPRITES[MINE_SPRITE_ID.STICKY_00];

        const image = scene.add.image(
            0,
            0,

            sprite.atlasKey,
            sprite.frameKey,
        );

        this.root.add(image);

        const target = createRandomMissTarget();

        scene.tweens.add({
            targets: this.root,

            x: target.x,

            y: target.y,

            scaleX: MISS_FLIGHT.endScale,

            scaleY: MISS_FLIGHT.endScale,

            alpha: 1,

            duration: MISS_FLIGHT.durationMs,

            ease: "Quad.In",

            onComplete: () => {
                if (this.completed) {
                    return;
                }

                this.completed = true;

                onComplete();
            },
        });
    }

    public destroy(): void {
        this.completed = true;

        this.scene.tweens.killTweensOf(this.root);

        this.root.destroy(true);
    }
}

function createRandomMissTarget(): Phaser.Math.Vector2 {
    const left = BRIDGE_VIEWSCREEN_RECT.x;

    const top = BRIDGE_VIEWSCREEN_RECT.y;

    const right = left + BRIDGE_VIEWSCREEN_RECT.width;

    const bottom = top + BRIDGE_VIEWSCREEN_RECT.height;

    const inset = MISS_FLIGHT.edgeInsetPx;

    switch (Phaser.Math.Between(0, 3)) {
        case 0:
            return new Phaser.Math.Vector2(
                left - MISS_FLIGHT.overflowPx,

                Phaser.Math.FloatBetween(top + inset, bottom - inset),
            );

        case 1:
            return new Phaser.Math.Vector2(
                right + MISS_FLIGHT.overflowPx,

                Phaser.Math.FloatBetween(top + inset, bottom - inset),
            );

        case 2:
            return new Phaser.Math.Vector2(
                Phaser.Math.FloatBetween(left + inset, right - inset),

                top - MISS_FLIGHT.overflowPx,
            );

        case 3:
        default:
            return new Phaser.Math.Vector2(
                Phaser.Math.FloatBetween(left + inset, right - inset),

                bottom + MISS_FLIGHT.overflowPx,
            );
    }
}
