// src/app/scenes/game/bridge/view/combat/outgoing_missiles/impact/BridgeOutgoingMissileImpactView.ts

import type BridgeScene from '../../../../BridgeScene';

type BridgeOutgoingMissileImpactViewOptions = {
    scene: BridgeScene;

    parent:
        Phaser.GameObjects.Container;

    position:
        Phaser.Math.Vector2;

    onComplete:
        (
            view:
                BridgeOutgoingMissileImpactView,
        ) => void;
};

const OUTGOING_MISSILE_IMPACT_PRESENTATION = {
    color: 0xffd88a,
    alpha: 0.85,

    radius: 10,
    scale: 4.5,

    durationMs: 160,
} as const;

// Short radial flash for a player missile that
// physically impacted the enemy ship.
//
// The engine already resolved the hit.
// This view owns presentation only.
export default class BridgeOutgoingMissileImpactView {
    private readonly flash:
        Phaser.GameObjects.Arc;

    private isDestroyed = false;

    constructor({
        scene,
        parent,
        position,
        onComplete,
    }: BridgeOutgoingMissileImpactViewOptions) {
        this.flash =
            scene.add.circle(
                position.x,
                position.y,

                OUTGOING_MISSILE_IMPACT_PRESENTATION
                    .radius,

                OUTGOING_MISSILE_IMPACT_PRESENTATION
                    .color,

                OUTGOING_MISSILE_IMPACT_PRESENTATION
                    .alpha,
            );

        parent.add(
            this.flash,
        );

        scene.tweens.add({
            targets:
                this.flash,

            scale:
                OUTGOING_MISSILE_IMPACT_PRESENTATION
                    .scale,

            alpha: 0,

            duration:
                OUTGOING_MISSILE_IMPACT_PRESENTATION
                    .durationMs,

            ease: 'Quad.Out',

            onComplete: () => {
                this.destroy();
                onComplete(this);
            },
        });
    }

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.flash.scene?.tweens
            .killTweensOf(
                this.flash,
            );

        this.flash.destroy();
    }
}
