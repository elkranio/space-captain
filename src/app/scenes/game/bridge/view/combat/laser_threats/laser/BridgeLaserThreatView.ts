// src/app/scenes/game/bridge/view/combat/laser_threats/laser/BridgeLaserThreatView.ts

import type { LaserTargetZone } from '../../../../../../../../engine/defs/laser';
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
    hotColor: 0xffe59a,
    outlineColor: 0x241326,

    particleCount: 14,

    particleSize: 3,
    particleOutlineSize: 5,

    maxRadiusX: 36,
    maxRadiusY: 24,

    cycleDurationMs: 650,

    minCoreSize: 6,
    maxCoreSize: 10,
    coreOutlinePadding: 2,
    hotCoreSize: 2,
} as const;

const TARGETING_FRAME = {
    color: LASER_CHARGE.color,

    halfWidth: 46,
    halfHeight: 32,

    cornerLength: 10,
    thickness: 2,

    labelGap: 3,
} as const;

// Leaf-view одной laser charging threat.
//
// Рамка и charge particles живут
// в одном local origin — точке будущего выстрела.
//
// Engine остаётся источником countdown и identification.
// Локальный elapsed используется только для циклического движения particles.
export default class BridgeLaserThreatView {
    private readonly scene: BridgeScene;

    private readonly root: Phaser.GameObjects.Container;

    private readonly chargeParticles: Phaser.GameObjects.Graphics;

    private readonly targetingFrame: Phaser.GameObjects.Graphics;

    private readonly statusLabel: Phaser.GameObjects.BitmapText;

    private readonly designation: string;

    private particleElapsedMs = 0;

    private timeToFireMs?: number;
    private initialTimeToFireMs?: number;

    private targetZone?: LaserTargetZone;

    constructor({
        scene,
        parent,

        designation,

        weaponOrigin,
    }: BridgeLaserThreatViewOptions) {
        this.scene = scene;
        this.designation = designation;

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

    public update(
        timeToFireMs: number,
        initialTimeToFireMs: number,
        targetZone?: LaserTargetZone,
    ): void {
        if (!Number.isFinite(initialTimeToFireMs) || initialTimeToFireMs <= 0) {
            throw new Error(
                `Laser threat initial time must be positive: ${initialTimeToFireMs}`,
            );
        }

        if (!Number.isFinite(timeToFireMs)) {
            throw new Error(
                `Laser threat remaining time must be finite: ${timeToFireMs}`,
            );
        }

        this.timeToFireMs = Phaser.Math.Clamp(
            timeToFireMs,
            0,
            initialTimeToFireMs,
        );

        this.initialTimeToFireMs = initialTimeToFireMs;
        this.targetZone = targetZone;

        this.statusLabel.setText(this.formatStatusLabel());
        this.drawChargeParticles();
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
        this.particleElapsedMs += deltaMs;

        this.drawChargeParticles();
    }

    private drawChargeParticles(): void {
        this.chargeParticles.clear();

        const chargeProgress = this.getChargeProgress();

        for (let index = 0; index < LASER_CHARGE.particleCount; index += 1) {
            const offset = index / LASER_CHARGE.particleCount;

            const cycleProgress =
                (this.particleElapsedMs / LASER_CHARGE.cycleDurationMs + offset) % 1;

            const radiusProgress = 1 - cycleProgress;
            const angle =
                offset * Math.PI * 2 +
                cycleProgress * 0.45;

            const chargeRadiusScale = Phaser.Math.Linear(
                1,
                0.82,
                chargeProgress,
            );

            const x =
                Math.cos(angle) *
                LASER_CHARGE.maxRadiusX *
                radiusProgress *
                chargeRadiusScale;

            const y =
                Math.sin(angle) *
                LASER_CHARGE.maxRadiusY *
                radiusProgress *
                chargeRadiusScale;

            const alpha = Phaser.Math.Linear(
                0.55,
                1,
                cycleProgress,
            );

            this.drawParticle(
                Math.round(x),
                Math.round(y),

                index % 3 === 0
                    ? LASER_CHARGE.hotColor
                    : LASER_CHARGE.color,

                alpha,
            );
        }

        const coreSize = Math.round(
            Phaser.Math.Linear(
                LASER_CHARGE.minCoreSize,
                LASER_CHARGE.maxCoreSize,
                chargeProgress,
            ),
        );

        this.drawCore(coreSize);
    }

    private drawParticle(
        x: number,
        y: number,

        color: number,
        alpha: number,
    ): void {
        this.chargeParticles.fillStyle(
            LASER_CHARGE.outlineColor,
            Math.min(1, alpha + 0.15),
        );

        this.chargeParticles.fillRect(
            x - Math.floor(LASER_CHARGE.particleOutlineSize / 2),
            y - Math.floor(LASER_CHARGE.particleOutlineSize / 2),

            LASER_CHARGE.particleOutlineSize,
            LASER_CHARGE.particleOutlineSize,
        );

        this.chargeParticles.fillStyle(color, alpha);

        this.chargeParticles.fillRect(
            x - Math.floor(LASER_CHARGE.particleSize / 2),
            y - Math.floor(LASER_CHARGE.particleSize / 2),

            LASER_CHARGE.particleSize,
            LASER_CHARGE.particleSize,
        );
    }

    private drawCore(coreSize: number): void {
        const outlineSize =
            coreSize +
            LASER_CHARGE.coreOutlinePadding * 2;

        this.chargeParticles.fillStyle(
            LASER_CHARGE.outlineColor,
            1,
        );

        this.chargeParticles.fillRect(
            -Math.floor(outlineSize / 2),
            -Math.floor(outlineSize / 2),

            outlineSize,
            outlineSize,
        );

        this.chargeParticles.fillStyle(
            LASER_CHARGE.color,
            1,
        );

        this.chargeParticles.fillRect(
            -Math.floor(coreSize / 2),
            -Math.floor(coreSize / 2),

            coreSize,
            coreSize,
        );

        this.chargeParticles.fillStyle(
            LASER_CHARGE.hotColor,
            1,
        );

        this.chargeParticles.fillRect(
            -Math.floor(LASER_CHARGE.hotCoreSize / 2),
            -Math.floor(LASER_CHARGE.hotCoreSize / 2),

            LASER_CHARGE.hotCoreSize,
            LASER_CHARGE.hotCoreSize,
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

    private formatStatusLabel(): string {
        if (
            this.timeToFireMs === undefined ||
            this.initialTimeToFireMs === undefined
        ) {
            return this.designation;
        }

        const parts = [this.designation];

        if (this.targetZone) {
            parts.push(this.targetZone.toUpperCase());
        }

        parts.push(this.formatTimeToFire(this.timeToFireMs));

        return parts.join(' ');
    }

    private formatTimeToFire(timeToFireMs: number): string {
        const remainingTenths = Math.max(
            0,
            Math.ceil(timeToFireMs / 100),
        );

        const seconds = Math.floor(remainingTenths / 10);
        const tenth = remainingTenths % 10;

        return String(seconds).padStart(2, '0') + ':' + String(tenth);
    }

    private getChargeProgress(): number {
        if (
            this.timeToFireMs === undefined ||
            this.initialTimeToFireMs === undefined
        ) {
            return 0;
        }

        return Phaser.Math.Clamp(
            1 - this.timeToFireMs / this.initialTimeToFireMs,
            0,
            1,
        );
    }
}
