// src/app/scenes/game/bridge/view/combat/incoming_missiles/missile/BridgeIncomingMissileView.ts

import { MISSILE_SPRITE_ID, MISSILE_SPRITES } from '../../../../../../../manifests/combat/missiles/missile_sprite';
import { FONT_FAMILY, FONT_SIZE } from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

type BridgeIncomingMissileViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    startPosition: Phaser.Math.Vector2;
    targetPosition: Phaser.Math.Vector2;

    initialTimeToImpactMs: number;
};

const MISSILE_PRESENTATION = {
    minScale: 0.12,
    maxScale: 1,

    framesPerSecond: 12,

    controlDriftX: 60,
    controlDriftY: 30,
} as const;

const TARGETING_FRAME = {
    color: 0xea9e3e,

    padding: 5,

    minHalfWidth: 30,
    minHalfHeight: 18,

    cornerLength: 8,
    thickness: 2,

    timerGap: 3,
} as const;

// Leaf-view одной ракеты.
//
// Владеет:
// - sprite;
// - траекторией;
// - targeting brackets;
// - countdown.
//
// Engine остаётся источником времени.
// View только отображает полученный timeToImpactMs.
export default class BridgeIncomingMissileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly image: Phaser.GameObjects.Image;

    private readonly targetingFrame: Phaser.GameObjects.Graphics;

    private readonly countdown: Phaser.GameObjects.BitmapText;

    private readonly startPosition: Phaser.Math.Vector2;

    private readonly controlPosition: Phaser.Math.Vector2;

    private readonly targetPosition: Phaser.Math.Vector2;

    private readonly initialTimeToImpactMs: number;

    constructor({
        scene,
        parent,

        startPosition,
        targetPosition,

        initialTimeToImpactMs,
    }: BridgeIncomingMissileViewOptions) {
        this.startPosition = startPosition.clone();

        this.targetPosition = targetPosition.clone();

        this.controlPosition = this.createControlPosition(this.startPosition, this.targetPosition);

        this.initialTimeToImpactMs = initialTimeToImpactMs;

        this.root = scene.add.container(this.startPosition.x, this.startPosition.y);

        parent.add(this.root);

        const sprite = MISSILE_SPRITES[MISSILE_SPRITE_ID.GENERIC_00];

        this.image = scene.add
            .image(
                0,
                0,

                sprite.atlasKey,
                sprite.frameKey,
            )
            .setScale(MISSILE_PRESENTATION.minScale)
            .setFlipX(this.targetPosition.x < this.startPosition.x);

        this.targetingFrame = scene.add.graphics();

        this.countdown = scene.add
            .bitmapText(
                0,
                0,

                FONT_FAMILY.VGA_8X14,
                '',

                FONT_SIZE.PX_16,
            )
            .setOrigin(0.5, 1)
            .setTint(TARGETING_FRAME.color);

        this.root.add(this.image);
        this.root.add(this.targetingFrame);
        this.root.add(this.countdown);

        this.update(initialTimeToImpactMs);
    }

    public update(timeToImpactMs: number): void {
        const progress = this.getQuantizedProgress(timeToImpactMs);

        const position = this.getQuadraticBezierPosition(progress);

        const scaleProgress = progress * progress;

        const scale = Phaser.Math.Linear(MISSILE_PRESENTATION.minScale, MISSILE_PRESENTATION.maxScale, scaleProgress);

        this.root.setPosition(Math.round(position.x), Math.round(position.y));

        this.image.setScale(scale);

        this.drawTargetingFrame();

        this.countdown.setText(this.formatTimeToImpact(timeToImpactMs));
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private drawTargetingFrame(): void {
        const halfWidth = Math.max(
            TARGETING_FRAME.minHalfWidth,

            Math.ceil(Math.abs(this.image.displayWidth) / 2) + TARGETING_FRAME.padding,
        );

        const halfHeight = Math.max(
            TARGETING_FRAME.minHalfHeight,

            Math.ceil(Math.abs(this.image.displayHeight) / 2) + TARGETING_FRAME.padding,
        );

        const left = -halfWidth;
        const right = halfWidth;

        const top = -halfHeight;
        const bottom = halfHeight;

        const length = TARGETING_FRAME.cornerLength;
        const thickness = TARGETING_FRAME.thickness;

        this.targetingFrame.clear();

        this.targetingFrame.fillStyle(TARGETING_FRAME.color, 1);

        // Top-left.
        this.targetingFrame.fillRect(left, top, length, thickness);

        this.targetingFrame.fillRect(left, top, thickness, length);

        // Top-right.
        this.targetingFrame.fillRect(right - length, top, length, thickness);

        this.targetingFrame.fillRect(right - thickness, top, thickness, length);

        // Bottom-left.
        this.targetingFrame.fillRect(left, bottom - thickness, length, thickness);

        this.targetingFrame.fillRect(left, bottom - length, thickness, length);

        // Bottom-right.
        this.targetingFrame.fillRect(right - length, bottom - thickness, length, thickness);

        this.targetingFrame.fillRect(right - thickness, bottom - length, thickness, length);

        this.countdown.setPosition(0, top - TARGETING_FRAME.timerGap);
    }

    private formatTimeToImpact(timeToImpactMs: number): string {
        const remainingTenths = Math.max(0, Math.ceil(timeToImpactMs / 100));

        const seconds = Math.floor(remainingTenths / 10);

        const tenth = remainingTenths % 10;

        return String(seconds).padStart(2, '0') + ':' + String(tenth);
    }

    private getQuantizedProgress(timeToImpactMs: number): number {
        const elapsedMs = this.initialTimeToImpactMs - timeToImpactMs;

        const frameDurationMs = 1000 / MISSILE_PRESENTATION.framesPerSecond;

        const quantizedElapsedMs = Math.floor(elapsedMs / frameDurationMs) * frameDurationMs;

        return Phaser.Math.Clamp(
            quantizedElapsedMs / this.initialTimeToImpactMs,

            0,
            1,
        );
    }

    private createControlPosition(start: Phaser.Math.Vector2, target: Phaser.Math.Vector2): Phaser.Math.Vector2 {
        const midpoint = start.clone().lerp(target, 0.5);

        midpoint.x += Phaser.Math.Between(-MISSILE_PRESENTATION.controlDriftX, MISSILE_PRESENTATION.controlDriftX);

        midpoint.y += Phaser.Math.Between(-MISSILE_PRESENTATION.controlDriftY, MISSILE_PRESENTATION.controlDriftY);

        return midpoint;
    }

    private getQuadraticBezierPosition(progress: number): Phaser.Math.Vector2 {
        const inverseProgress = 1 - progress;

        const startWeight = inverseProgress * inverseProgress;

        const controlWeight = 2 * inverseProgress * progress;

        const targetWeight = progress * progress;

        return new Phaser.Math.Vector2(
            startWeight * this.startPosition.x +
                controlWeight * this.controlPosition.x +
                targetWeight * this.targetPosition.x,

            startWeight * this.startPosition.y +
                controlWeight * this.controlPosition.y +
                targetWeight * this.targetPosition.y,
        );
    }
}
