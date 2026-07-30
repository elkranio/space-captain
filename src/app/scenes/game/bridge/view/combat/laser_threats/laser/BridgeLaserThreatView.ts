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

type LaserChargeParticleState = {
    angle: number;
    radiusScale: number;

    elapsedMs: number;

    holdDurationMs: number;
    snapDurationMs: number;
};

const LASER_CHARGE = {
    color: 0x43d9ff,
    hotColor: 0xd7f9ff,
    outlineColor: 0x07182a,

    particleCount: 8,

    particleSize: 3,
    particleOutlineSize: 5,

    maxRadiusX: 38,
    maxRadiusY: 25,

    initialStaggerMaxMs: 900,
    respawnDelayMinMs: 60,
    respawnDelayMaxMs: 220,

    holdDurationMinMs: 240,
    holdDurationMaxMs: 460,

    snapDurationMinMs: 170,
    snapDurationMaxMs: 250,

    holdFrameDurationMs: 90,

    minTrailLength: 8,
    maxTrailLength: 24,

    trailOutlineThickness: 4,
    trailThickness: 2,
    hotTrailThickness: 1,

    idleCoreSize: 2,

    coreFlashDurationMs: 110,
    coreFlashMinSize: 7,
    coreFlashMaxSize: 12,
} as const;

const TARGETING_FRAME = {
    color: 0xea9e3e,

    halfWidth: 46,
    halfHeight: 32,

    cornerLength: 10,
    thickness: 2,

    labelGap: 3,
} as const;

// Leaf-view одной laser charging threat.
//
// Рамка, HUD и charge effect живут
// в одном local origin — точке будущего выстрела.
//
// Engine остаётся источником countdown и identification.
// Локальное время используется только для VFX.
//
// Каждая particle имеет независимый lifecycle:
//
// 1. появляется снаружи после собственного delay;
// 2. коротко держится и дрожит;
// 3. резко втягивается в origin с cyan trail;
// 4. запускает короткую core flash;
// 5. получает новый случайный delay и повторяет цикл.
export default class BridgeLaserThreatView {
    private readonly scene: BridgeScene;

    private readonly root: Phaser.GameObjects.Container;

    private readonly chargeParticles: Phaser.GameObjects.Graphics;

    private readonly targetingFrame: Phaser.GameObjects.Graphics;

    private readonly statusLabel: Phaser.GameObjects.BitmapText;

    private readonly designation: string;

    private readonly particleStates: LaserChargeParticleState[];

    private coreFlashElapsedMs = Number.POSITIVE_INFINITY;

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

        this.particleStates = this.createParticleStates();

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
        this.drawChargeEffect();

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
        this.drawChargeEffect();
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
        this.advanceParticles(deltaMs);

        this.coreFlashElapsedMs += deltaMs;

        this.drawChargeEffect();
    }

    private createParticleStates(): LaserChargeParticleState[] {
        return Array.from(
            {
                length: LASER_CHARGE.particleCount,
            },

            (_unused, index) => {
                const state = this.createParticleState(index);

                state.elapsedMs = -Phaser.Math.Between(
                    0,
                    LASER_CHARGE.initialStaggerMaxMs,
                );

                return state;
            },
        );
    }

    private createParticleState(
        index: number,
    ): LaserChargeParticleState {
        const sectorAngle =
            (index / LASER_CHARGE.particleCount) *
            Math.PI *
            2;

        const sectorJitter =
            Phaser.Math.FloatBetween(
                -0.22,
                0.22,
            );

        return {
            angle: sectorAngle + sectorJitter,

            radiusScale: Phaser.Math.FloatBetween(
                0.78,
                1,
            ),

            elapsedMs: 0,

            holdDurationMs: Phaser.Math.Between(
                LASER_CHARGE.holdDurationMinMs,
                LASER_CHARGE.holdDurationMaxMs,
            ),

            snapDurationMs: Phaser.Math.Between(
                LASER_CHARGE.snapDurationMinMs,
                LASER_CHARGE.snapDurationMaxMs,
            ),
        };
    }

    private advanceParticles(deltaMs: number): void {
        for (let index = 0; index < this.particleStates.length; index += 1) {
            const state = this.particleStates[index];

            if (!state) {
                throw new Error(
                    `Laser charge particle state not found: ${index}`,
                );
            }

            state.elapsedMs += deltaMs;

            const lifecycleDurationMs =
                state.holdDurationMs +
                state.snapDurationMs;

            if (state.elapsedMs < lifecycleDurationMs) {
                continue;
            }

            this.coreFlashElapsedMs = 0;

            const overflowMs =
                state.elapsedMs -
                lifecycleDurationMs;

            this.resetParticleState(
                state,
                index,
                overflowMs,
            );
        }
    }

    private resetParticleState(
        state: LaserChargeParticleState,
        index: number,
        overflowMs: number,
    ): void {
        const next = this.createParticleState(index);

        state.angle = next.angle;
        state.radiusScale = next.radiusScale;

        state.holdDurationMs = next.holdDurationMs;
        state.snapDurationMs = next.snapDurationMs;

        const respawnDelayMs = Phaser.Math.Between(
            LASER_CHARGE.respawnDelayMinMs,
            LASER_CHARGE.respawnDelayMaxMs,
        );

        state.elapsedMs =
            overflowMs -
            respawnDelayMs;
    }

    private drawChargeEffect(): void {
        this.chargeParticles.clear();

        this.drawIdleCore();

        for (let index = 0; index < this.particleStates.length; index += 1) {
            const state = this.particleStates[index];

            if (!state || state.elapsedMs < 0) {
                continue;
            }

            if (state.elapsedMs < state.holdDurationMs) {
                this.drawParticleHold(
                    state,
                    index,
                );

                continue;
            }

            const snapProgress =
                (state.elapsedMs - state.holdDurationMs) /
                state.snapDurationMs;

            this.drawParticleSnap(
                state,
                index,
                snapProgress,
            );
        }

        this.drawCoreFlash();
    }

    private drawParticleHold(
        state: LaserChargeParticleState,
        index: number,
    ): void {
        const start = this.getParticleStartPosition(state);

        const holdFrame = Math.floor(
            state.elapsedMs /
                LASER_CHARGE.holdFrameDurationMs,
        );

        const jitterX =
            ((holdFrame + index * 2) % 3) -
            1;

        const jitterY =
            ((holdFrame * 2 + index) % 3) -
            1;

        const appearProgress = Phaser.Math.Clamp(
            state.elapsedMs / 90,
            0,
            1,
        );

        this.drawParticleHead(
            Math.round(start.x) + jitterX,
            Math.round(start.y) + jitterY,

            this.getParticleColor(index),
            Phaser.Math.Linear(
                0.35,
                1,
                appearProgress,
            ),
        );
    }

    private drawParticleSnap(
        state: LaserChargeParticleState,
        index: number,
        snapProgress: number,
    ): void {
        const progress = Phaser.Math.Clamp(
            snapProgress,
            0,
            1,
        );

        const easedProgress =
            1 -
            Math.pow(
                1 - progress,
                3,
            );

        const start = this.getParticleStartPosition(state);

        const x = Math.round(
            Phaser.Math.Linear(
                start.x,
                0,
                easedProgress,
            ),
        );

        const y = Math.round(
            Phaser.Math.Linear(
                start.y,
                0,
                easedProgress,
            ),
        );

        const trailLength = Phaser.Math.Linear(
            LASER_CHARGE.minTrailLength,
            LASER_CHARGE.maxTrailLength,
            easedProgress,
        );

        const color = this.getParticleColor(index);

        this.drawParticleTrail(
            x,
            y,

            start.x,
            start.y,

            trailLength,

            color,
            Phaser.Math.Linear(
                0.78,
                1,
                progress,
            ),
        );

        this.drawParticleHead(
            x,
            y,

            color,
            1,
        );
    }

    private getParticleStartPosition(
        state: LaserChargeParticleState,
    ): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(
            Math.cos(state.angle) *
                LASER_CHARGE.maxRadiusX *
                state.radiusScale,

            Math.sin(state.angle) *
                LASER_CHARGE.maxRadiusY *
                state.radiusScale,
        );
    }

    private getParticleColor(index: number): number {
        return index % 3 === 0
            ? LASER_CHARGE.hotColor
            : LASER_CHARGE.color;
    }

    private drawParticleTrail(
        x: number,
        y: number,

        sourceX: number,
        sourceY: number,

        trailLength: number,

        color: number,
        alpha: number,
    ): void {
        const sourceDistance = Math.sqrt(
            sourceX * sourceX +
                sourceY * sourceY,
        );

        if (sourceDistance <= 0) {
            return;
        }

        const directionX =
            sourceX /
            sourceDistance;

        const directionY =
            sourceY /
            sourceDistance;

        const trailEndX = Math.round(
            x +
                directionX *
                    trailLength,
        );

        const trailEndY = Math.round(
            y +
                directionY *
                    trailLength,
        );

        this.chargeParticles.lineStyle(
            LASER_CHARGE.trailOutlineThickness,
            LASER_CHARGE.outlineColor,
            Math.min(1, alpha + 0.1),
        );

        this.chargeParticles.lineBetween(
            x,
            y,
            trailEndX,
            trailEndY,
        );

        this.chargeParticles.lineStyle(
            LASER_CHARGE.trailThickness,
            color,
            alpha,
        );

        this.chargeParticles.lineBetween(
            x,
            y,
            trailEndX,
            trailEndY,
        );

        this.chargeParticles.lineStyle(
            LASER_CHARGE.hotTrailThickness,
            LASER_CHARGE.hotColor,
            Math.min(1, alpha + 0.15),
        );

        this.chargeParticles.lineBetween(
            x,
            y,
            trailEndX,
            trailEndY,
        );
    }

    private drawParticleHead(
        x: number,
        y: number,

        color: number,
        alpha: number,
    ): void {
        this.chargeParticles.fillStyle(
            LASER_CHARGE.outlineColor,
            Math.min(1, alpha + 0.12),
        );

        this.chargeParticles.fillRect(
            x -
                Math.floor(
                    LASER_CHARGE.particleOutlineSize /
                        2,
                ),

            y -
                Math.floor(
                    LASER_CHARGE.particleOutlineSize /
                        2,
                ),

            LASER_CHARGE.particleOutlineSize,
            LASER_CHARGE.particleOutlineSize,
        );

        this.chargeParticles.fillStyle(
            color,
            alpha,
        );

        this.chargeParticles.fillRect(
            x -
                Math.floor(
                    LASER_CHARGE.particleSize /
                        2,
                ),

            y -
                Math.floor(
                    LASER_CHARGE.particleSize /
                        2,
                ),

            LASER_CHARGE.particleSize,
            LASER_CHARGE.particleSize,
        );
    }

    private drawIdleCore(): void {
        this.drawSquareCore(
            LASER_CHARGE.idleCoreSize,
            LASER_CHARGE.hotColor,
            0.9,
        );
    }

    private drawCoreFlash(): void {
        if (
            this.coreFlashElapsedMs >=
            LASER_CHARGE.coreFlashDurationMs
        ) {
            return;
        }

        const progress = Phaser.Math.Clamp(
            this.coreFlashElapsedMs /
                LASER_CHARGE.coreFlashDurationMs,
            0,
            1,
        );

        const inverseProgress = 1 - progress;

        const size = Math.round(
            Phaser.Math.Linear(
                LASER_CHARGE.coreFlashMinSize,
                LASER_CHARGE.coreFlashMaxSize,
                progress,
            ),
        );

        const alpha = Phaser.Math.Clamp(
            inverseProgress * 1.3,
            0,
            1,
        );

        this.drawSquareCore(
            size,
            LASER_CHARGE.color,
            alpha,
        );

        const crossLength = size + 7;
        const crossThickness = 2;

        this.chargeParticles.fillStyle(
            LASER_CHARGE.hotColor,
            alpha,
        );

        this.chargeParticles.fillRect(
            -Math.floor(crossLength / 2),
            -Math.floor(crossThickness / 2),

            crossLength,
            crossThickness,
        );

        this.chargeParticles.fillRect(
            -Math.floor(crossThickness / 2),
            -Math.floor(crossLength / 2),

            crossThickness,
            crossLength,
        );
    }

    private drawSquareCore(
        size: number,
        color: number,
        alpha: number,
    ): void {
        const outlineSize = size + 4;

        this.chargeParticles.fillStyle(
            LASER_CHARGE.outlineColor,
            Math.min(1, alpha + 0.1),
        );

        this.chargeParticles.fillRect(
            -Math.floor(outlineSize / 2),
            -Math.floor(outlineSize / 2),

            outlineSize,
            outlineSize,
        );

        this.chargeParticles.fillStyle(
            color,
            alpha,
        );

        this.chargeParticles.fillRect(
            -Math.floor(size / 2),
            -Math.floor(size / 2),

            size,
            size,
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
}
