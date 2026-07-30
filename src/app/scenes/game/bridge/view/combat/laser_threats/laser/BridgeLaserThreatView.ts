// src/app/scenes/game/bridge/view/combat/laser_threats/laser/BridgeLaserThreatView.ts

import { FONT_FAMILY, FONT_SIZE } from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

type BridgeLaserThreatViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    designation: string;

    weaponOrigin: Phaser.Math.Vector2;
};

const LASER_CHARGE = {
    color: 0xea9e3e,

    particleCount: 10,
    particleSize: 2,

    maxRadiusX: 27,
    maxRadiusY: 18,

    cycleDurationMs: 700,

    coreSize: 4,
} as const;

const TARGETING_FRAME = {
    color: LASER_CHARGE.color,

    halfWidth: 36,
    halfHeight: 25,

    cornerLength: 8,
    thickness: 2,

    labelGap: 3,
} as const;

// Leaf-view одной laser charging threat.
//
// Рамка и charge particles живут
// в одном local origin — точке будущего выстрела.
//
// В этом атоме HUD показывает только designation.
// Identified target zone добавится отдельным snapshot-атомом.
export default class BridgeLaserThreatView {
    private readonly scene: BridgeScene;

    private readonly root: Phaser.GameObjects.Container;

    private readonly chargeParticles: Phaser.GameObjects.Graphics;

    private readonly targetingFrame: Phaser.GameObjects.Graphics;

    private readonly statusLabel: Phaser.GameObjects.BitmapText;

    private elapsedMs = 0;

    constructor({
        scene,
        parent,

        designation,

        weaponOrigin,
    }: BridgeLaserThreatViewOptions) {
        this.scene = scene;

        this.root = scene.add.container(
            Math.round(weaponOrigin.x),
            Math.round(weaponOrigin.y),
        );

        parent.add(this.root);

        this.chargeParticles = scene.add.graphics();
        this.targetingFrame = scene.add.graphics();

        this.statusLabel = scene.add
            .bitmapText(
                0,
                TARGETING_FRAME.halfHeight + TARGETING_FRAME.labelGap,

                FONT_FAMILY.VGA_8X14,
                designation,

                FONT_SIZE.PX_16,
            )
            .setOrigin(0.5, 0)
            .setTint(TARGETING_FRAME.color);

        this.root.add([
            this.chargeParticles,
            this.targetingFrame,
            this.statusLabel,
        ]);

        this.drawTargetingFrame();
        this.drawChargeParticles();

        this.scene.events.on(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );
    }

    public destroy(): void {
        this.scene.events.off(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );

        this.root.destroy(true);
    }

    private handleSceneUpdate(_time: number, deltaMs: number): void {
        this.elapsedMs += deltaMs;

        this.drawChargeParticles();
    }

    private drawChargeParticles(): void {
        this.chargeParticles.clear();

        for (let index = 0; index < LASER_CHARGE.particleCount; index += 1) {
            const offset = index / LASER_CHARGE.particleCount;

            const progress =
                (this.elapsedMs / LASER_CHARGE.cycleDurationMs + offset) % 1;

            const radiusProgress = 1 - progress;
            const angle =
                offset * Math.PI * 2 +
                progress * 0.35;

            const x =
                Math.cos(angle) *
                LASER_CHARGE.maxRadiusX *
                radiusProgress;

            const y =
                Math.sin(angle) *
                LASER_CHARGE.maxRadiusY *
                radiusProgress;

            const alpha = 0.25 + progress * 0.75;

            this.chargeParticles.fillStyle(
                LASER_CHARGE.color,
                alpha,
            );

            this.chargeParticles.fillRect(
                Math.round(x) - LASER_CHARGE.particleSize / 2,
                Math.round(y) - LASER_CHARGE.particleSize / 2,

                LASER_CHARGE.particleSize,
                LASER_CHARGE.particleSize,
            );
        }

        this.chargeParticles.fillStyle(
            LASER_CHARGE.color,
            1,
        );

        this.chargeParticles.fillRect(
            -LASER_CHARGE.coreSize / 2,
            -LASER_CHARGE.coreSize / 2,

            LASER_CHARGE.coreSize,
            LASER_CHARGE.coreSize,
        );
    }

    private drawTargetingFrame(): void {
        const left = -TARGETING_FRAME.halfWidth;
        const right = TARGETING_FRAME.halfWidth;

        const top = -TARGETING_FRAME.halfHeight;
        const bottom = TARGETING_FRAME.halfHeight;

        const length = TARGETING_FRAME.cornerLength;
        const thickness = TARGETING_FRAME.thickness;

        this.targetingFrame.clear();
        this.targetingFrame.fillStyle(TARGETING_FRAME.color, 1);

        // Top-left.
        this.targetingFrame.fillRect(left, top, length, thickness);
        this.targetingFrame.fillRect(left, top, thickness, length);

        // Top-right.
        this.targetingFrame.fillRect(
            right - length,
            top,

            length,
            thickness,
        );

        this.targetingFrame.fillRect(
            right - thickness,
            top,

            thickness,
            length,
        );

        // Bottom-left.
        this.targetingFrame.fillRect(
            left,
            bottom - thickness,

            length,
            thickness,
        );

        this.targetingFrame.fillRect(
            left,
            bottom - length,

            thickness,
            length,
        );

        // Bottom-right.
        this.targetingFrame.fillRect(
            right - length,
            bottom - thickness,

            length,
            thickness,
        );

        this.targetingFrame.fillRect(
            right - thickness,
            bottom - length,

            thickness,
            length,
        );
    }
}
