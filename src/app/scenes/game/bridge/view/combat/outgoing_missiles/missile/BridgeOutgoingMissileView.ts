// src/app/scenes/game/bridge/view/combat/outgoing_missiles/missile/BridgeOutgoingMissileView.ts

import {
    MISSILE_SPRITE_ID,
    MISSILE_SPRITES,
} from '../../../../../../../manifests/combat/missiles/missile_sprite';
import type BridgeScene from '../../../../BridgeScene';

type BridgeOutgoingMissileViewOptions = {
    scene: BridgeScene;

    parent:
        Phaser.GameObjects.Container;

    startPosition:
        Phaser.Math.Vector2;

    targetPosition:
        Phaser.Math.Vector2;

    initialTimeToImpactMs: number;
};

const OUTGOING_MISSILE_PRESENTATION = {
    startScale: 1,
    targetScale: 0.18,

    framesPerSecond: 12,
} as const;

// One player missile in flight.
//
// Engine owns time.
// View only moves and scales the sprite.
export default class BridgeOutgoingMissileView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly image:
        Phaser.GameObjects.Image;

    private readonly startPosition:
        Phaser.Math.Vector2;

    private readonly targetPosition:
        Phaser.Math.Vector2;

    private readonly initialTimeToImpactMs:
        number;

    constructor({
        scene,
        parent,

        startPosition,
        targetPosition,

        initialTimeToImpactMs,
    }: BridgeOutgoingMissileViewOptions) {
        this.startPosition =
            startPosition.clone();

        this.targetPosition =
            targetPosition.clone();

        this.initialTimeToImpactMs =
            initialTimeToImpactMs;

        this.root =
            scene.add.container(
                this.startPosition.x,
                this.startPosition.y,
            );

        parent.add(this.root);

        const sprite =
            MISSILE_SPRITES[
                MISSILE_SPRITE_ID
                    .GENERIC_OUTGOING_00
            ];

        this.image =
            scene.add
                .image(
                    0,
                    0,

                    sprite.atlasKey,
                    sprite.frameKey,
                )
                .setScale(
                    OUTGOING_MISSILE_PRESENTATION
                        .startScale,
                )
                .setAngle(
                    this.getTravelAngle(),
                );

        this.root.add(this.image);

        this.update(
            initialTimeToImpactMs,
        );
    }

    public update(
        timeToImpactMs: number,
    ): void {
        const progress =
            this.getQuantizedProgress(
                timeToImpactMs,
            );

        const position =
            this.startPosition
                .clone()
                .lerp(
                    this.targetPosition,
                    progress,
                );

        // Perspective size drops fastest
        // near the player.
        const scaleProgress =
            Math.sqrt(progress);

        const scale =
            Phaser.Math.Linear(
                OUTGOING_MISSILE_PRESENTATION
                    .startScale,

                OUTGOING_MISSILE_PRESENTATION
                    .targetScale,

                scaleProgress,
            );

        this.root.setPosition(
            Math.round(position.x),
            Math.round(position.y),
        );

        this.image.setScale(scale);
    }

    public getPosition():
        Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(
            this.root.x,
            this.root.y,
        );
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private getTravelAngle(): number {
        const direction =
            Phaser.Math.Angle.Between(
                this.startPosition.x,
                this.startPosition.y,

                this.targetPosition.x,
                this.targetPosition.y,
            );

        // Asset nose points to 12 o'clock.
        return (
            Phaser.Math.RadToDeg(
                direction,
            ) + 90
        );
    }

    private getQuantizedProgress(
        timeToImpactMs: number,
    ): number {
        const elapsedMs =
            this.initialTimeToImpactMs -
            timeToImpactMs;

        const frameDurationMs =
            1000 /
            OUTGOING_MISSILE_PRESENTATION
                .framesPerSecond;

        const quantizedElapsedMs =
            Math.floor(
                elapsedMs /
                    frameDurationMs,
            ) *
            frameDurationMs;

        return Phaser.Math.Clamp(
            quantizedElapsedMs /
                this.initialTimeToImpactMs,

            0,
            1,
        );
    }
}
