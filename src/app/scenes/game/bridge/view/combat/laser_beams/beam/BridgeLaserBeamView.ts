// src/app/scenes/game/bridge/view/combat/laser_beams/beam/BridgeLaserBeamView.ts

import type BridgeScene from '../../../../BridgeScene';

type BridgeLaserBeamViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    sourcePosition: Phaser.Math.Vector2;
    targetPosition: Phaser.Math.Vector2;

    onComplete: () => void;
};

const LASER_BEAM = {
    extendDurationMs: 80,
    holdDurationMs: 100,
    fadeDurationMs: 120,

    outlineColor: 0x07182a,
    bodyColor: 0x43d9ff,
    coreColor: 0xd7f9ff,

    outlineSourceHalfWidth: 2.5,
    outlineTargetHalfWidth: 7,

    bodySourceHalfWidth: 1.5,
    bodyTargetHalfWidth: 5,

    coreSourceHalfWidth: 0.5,
    coreTargetHalfWidth: 1.5,
} as const;

// Один короткий enemy laser shot.
//
// Beam появляется почти мгновенно, а не летит как projectile.
// Перспектива задаётся трапецией:
// узкий источник у enemy weapon и более широкий ближний конец.
export default class BridgeLaserBeamView {
    private readonly scene: BridgeScene;

    private readonly graphics: Phaser.GameObjects.Graphics;

    private readonly sourcePosition: Phaser.Math.Vector2;
    private readonly targetPosition: Phaser.Math.Vector2;

    private readonly onComplete: () => void;

    private elapsedMs = 0;
    private completed = false;
    private destroyed = false;

    constructor({
        scene,
        parent,

        sourcePosition,
        targetPosition,

        onComplete,
    }: BridgeLaserBeamViewOptions) {
        this.scene = scene;

        this.sourcePosition = sourcePosition.clone();
        this.targetPosition = targetPosition.clone();

        this.onComplete = onComplete;

        this.graphics = scene.add.graphics();
        parent.add(this.graphics);

        this.draw();

        this.scene.events.on(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );
    }

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

    private handleSceneUpdate(_time: number, deltaMs: number): void {
        if (this.completed) {
            return;
        }

        this.elapsedMs += deltaMs;

        const totalDurationMs =
            LASER_BEAM.extendDurationMs +
            LASER_BEAM.holdDurationMs +
            LASER_BEAM.fadeDurationMs;

        if (this.elapsedMs >= totalDurationMs) {
            this.completed = true;
            this.onComplete();
            return;
        }

        this.draw();
    }

    private draw(): void {
        this.graphics.clear();

        const extensionProgress = Phaser.Math.Clamp(
            this.elapsedMs / LASER_BEAM.extendDurationMs,
            0,
            1,
        );

        const easedExtensionProgress =
            1 - Math.pow(1 - extensionProgress, 3);

        const currentTarget = this.sourcePosition.clone().lerp(
            this.targetPosition,
            easedExtensionProgress,
        );

        const alpha = this.getAlpha();

        this.drawBeamLayer(
            currentTarget,
            LASER_BEAM.outlineSourceHalfWidth,
            Phaser.Math.Linear(
                LASER_BEAM.outlineSourceHalfWidth,
                LASER_BEAM.outlineTargetHalfWidth,
                easedExtensionProgress,
            ),
            LASER_BEAM.outlineColor,
            alpha,
        );

        this.drawBeamLayer(
            currentTarget,
            LASER_BEAM.bodySourceHalfWidth,
            Phaser.Math.Linear(
                LASER_BEAM.bodySourceHalfWidth,
                LASER_BEAM.bodyTargetHalfWidth,
                easedExtensionProgress,
            ),
            LASER_BEAM.bodyColor,
            alpha,
        );

        this.drawBeamLayer(
            currentTarget,
            LASER_BEAM.coreSourceHalfWidth,
            Phaser.Math.Linear(
                LASER_BEAM.coreSourceHalfWidth,
                LASER_BEAM.coreTargetHalfWidth,
                easedExtensionProgress,
            ),
            LASER_BEAM.coreColor,
            alpha,
        );
    }

    private drawBeamLayer(
        currentTarget: Phaser.Math.Vector2,

        sourceHalfWidth: number,
        targetHalfWidth: number,

        color: number,
        alpha: number,
    ): void {
        const direction = currentTarget.clone().subtract(this.sourcePosition);

        if (direction.lengthSq() <= 0) {
            return;
        }

        direction.normalize();

        const perpendicular = new Phaser.Math.Vector2(
            -direction.y,
            direction.x,
        );

        const sourceOffset = perpendicular.clone().scale(sourceHalfWidth);
        const targetOffset = perpendicular.clone().scale(targetHalfWidth);

        this.graphics.fillStyle(color, alpha);

        this.graphics.fillPoints(
            [
                this.sourcePosition.clone().add(sourceOffset),
                currentTarget.clone().add(targetOffset),
                currentTarget.clone().subtract(targetOffset),
                this.sourcePosition.clone().subtract(sourceOffset),
            ],
            true,
        );
    }

    private getAlpha(): number {
        const fadeStartMs =
            LASER_BEAM.extendDurationMs +
            LASER_BEAM.holdDurationMs;

        if (this.elapsedMs <= fadeStartMs) {
            return 1;
        }

        return Phaser.Math.Clamp(
            1 -
                (this.elapsedMs - fadeStartMs) /
                    LASER_BEAM.fadeDurationMs,
            0,
            1,
        );
    }
}
