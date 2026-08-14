// src/app/scenes/game/bridge/view/combat/beam_cannon_beams/beam/BridgeBeamCannonBeamView.ts

import type BridgeScene from '../../../../BridgeScene';

type BridgeBeamCannonBeamViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    sourcePosition:
        Phaser.Math.Vector2;

    targetPosition:
        Phaser.Math.Vector2;

    // true:
    // player source находится ближе камеры,
    // поэтому beam шире у source.
    sourceNear?: boolean;

    onComplete: () => void;
};

const BEAM_CANNON_BEAM = {
    extendDurationMs: 80,
    holdDurationMs: 100,
    fadeDurationMs: 120,

    outlineColor: 0x07182a,
    bodyColor: 0x43d9ff,
    coreColor: 0xd7f9ff,

    outlineFarHalfWidth: 2.5,
    outlineNearHalfWidth: 7,

    bodyFarHalfWidth: 1.5,
    bodyNearHalfWidth: 5,

    coreFarHalfWidth: 0.5,
    coreNearHalfWidth: 1.5,
} as const;

// Один короткий beamCannon shot.
//
// Beam подходит и enemy, и player:
// sourceNear определяет, какой конец
// перспективно расположен ближе камеры.
export default class BridgeBeamCannonBeamView {
    private readonly graphics:
        Phaser.GameObjects.Graphics;

    private readonly sourcePosition:
        Phaser.Math.Vector2;

    private readonly targetPosition:
        Phaser.Math.Vector2;

    private elapsedMs = 0;

    private completed = false;
    private destroyed = false;

    constructor({
        scene,
        parent,

        sourcePosition,
        targetPosition,

        sourceNear = false,

        onComplete,
    }: BridgeBeamCannonBeamViewOptions) {
        this.scene = scene;

        this.sourcePosition =
            sourcePosition.clone();

        this.targetPosition =
            targetPosition.clone();

        this.sourceNear =
            sourceNear;

        this.onComplete =
            onComplete;

        this.graphics =
            scene.add.graphics();

        parent.add(this.graphics);

        this.draw();

        this.scene.events.on(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );
    }

    private readonly scene:
        BridgeScene;

    private readonly sourceNear:
        boolean;

    private readonly onComplete:
        () => void;

    public destroy(): void {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        this.scene.events.off(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );

        this.graphics.destroy();
    }

    private handleSceneUpdate(
        _time: number,
        deltaMs: number,
    ): void {
        if (this.completed) {
            return;
        }

        this.elapsedMs += deltaMs;

        const totalDurationMs =
            BEAM_CANNON_BEAM
                .extendDurationMs +
            BEAM_CANNON_BEAM
                .holdDurationMs +
            BEAM_CANNON_BEAM
                .fadeDurationMs;

        if (
            this.elapsedMs >=
            totalDurationMs
        ) {
            this.completed = true;
            this.onComplete();

            return;
        }

        this.draw();
    }

    private draw(): void {
        this.graphics.clear();

        const extensionProgress =
            Phaser.Math.Clamp(
                this.elapsedMs /
                    BEAM_CANNON_BEAM
                        .extendDurationMs,

                0,
                1,
            );

        const easedProgress =
            1 -
            Math.pow(
                1 -
                    extensionProgress,

                3,
            );

        const currentTarget =
            this.sourcePosition
                .clone()
                .lerp(
                    this.targetPosition,
                    easedProgress,
                );

        const alpha =
            this.getAlpha();

        this.drawBeamLayer(
            currentTarget,

            BEAM_CANNON_BEAM
                .outlineFarHalfWidth,

            BEAM_CANNON_BEAM
                .outlineNearHalfWidth,

            BEAM_CANNON_BEAM
                .outlineColor,

            alpha,
            easedProgress,
        );

        this.drawBeamLayer(
            currentTarget,

            BEAM_CANNON_BEAM
                .bodyFarHalfWidth,

            BEAM_CANNON_BEAM
                .bodyNearHalfWidth,

            BEAM_CANNON_BEAM.bodyColor,

            alpha,
            easedProgress,
        );

        this.drawBeamLayer(
            currentTarget,

            BEAM_CANNON_BEAM
                .coreFarHalfWidth,

            BEAM_CANNON_BEAM
                .coreNearHalfWidth,

            BEAM_CANNON_BEAM.coreColor,

            alpha,
            easedProgress,
        );
    }

    private drawBeamLayer(
        currentTarget:
            Phaser.Math.Vector2,

        farHalfWidth: number,
        nearHalfWidth: number,

        color: number,
        alpha: number,

        extensionProgress: number,
    ): void {
        const direction =
            currentTarget
                .clone()
                .subtract(
                    this.sourcePosition,
                );

        if (
            direction.lengthSq() <= 0
        ) {
            return;
        }

        direction.normalize();

        const perpendicular =
            new Phaser.Math.Vector2(
                -direction.y,
                direction.x,
            );

        const sourceHalfWidth =
            this.sourceNear
                ? nearHalfWidth
                : farHalfWidth;

        const finalTargetHalfWidth =
            this.sourceNear
                ? farHalfWidth
                : nearHalfWidth;

        const targetHalfWidth =
            Phaser.Math.Linear(
                sourceHalfWidth,
                finalTargetHalfWidth,
                extensionProgress,
            );

        const sourceOffset =
            perpendicular
                .clone()
                .scale(
                    sourceHalfWidth,
                );

        const targetOffset =
            perpendicular
                .clone()
                .scale(
                    targetHalfWidth,
                );

        this.graphics.fillStyle(
            color,
            alpha,
        );

        this.graphics.fillPoints(
            [
                this.sourcePosition
                    .clone()
                    .add(
                        sourceOffset,
                    ),

                currentTarget
                    .clone()
                    .add(
                        targetOffset,
                    ),

                currentTarget
                    .clone()
                    .subtract(
                        targetOffset,
                    ),

                this.sourcePosition
                    .clone()
                    .subtract(
                        sourceOffset,
                    ),
            ],

            true,
        );
    }

    private getAlpha(): number {
        const fadeStartMs =
            BEAM_CANNON_BEAM
                .extendDurationMs +
            BEAM_CANNON_BEAM
                .holdDurationMs;

        if (
            this.elapsedMs <=
            fadeStartMs
        ) {
            return 1;
        }

        return Phaser.Math.Clamp(
            1 -
                (this.elapsedMs -
                    fadeStartMs) /
                    BEAM_CANNON_BEAM
                        .fadeDurationMs,

            0,
            1,
        );
    }
}
