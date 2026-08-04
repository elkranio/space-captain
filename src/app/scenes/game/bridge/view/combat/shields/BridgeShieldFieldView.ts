// src/app/scenes/game/bridge/view/combat/shields/BridgeShieldFieldView.ts

import type { LaserTargetZone } from '../../../../../../../engine/defs/laser';
import { PLAYER_SHIELD_SPRITES } from '../../../../../../manifests/bridge/combat_shields';
import type BridgeScene from '../../../BridgeScene';

const SHIELD_FIELD_VFX = {
    baseAlpha: 0.42,

    activationFadeMs: 120,

    idleFlickerAmplitude: 0.035,
    idleFlickerFrameMs: 110,

    expirationWarningMs: 1000,
    expirationBlinkHalfPeriodMs: 125,
    expirationLowAlpha: 0.08,

    impactFlashInMs: 50,
    impactHoldMs: 40,
    impactFadeOutMs: 170,
} as const;

type BridgeShieldFieldViewOptions = {
    scene: BridgeScene;

    parent: Phaser.GameObjects.Container;

    zone: LaserTargetZone;

    position: Phaser.Math.Vector2;

    scale: number;

    remainingDurationMs: number;
    initialDurationMs: number;

    onImpactComplete: (field: BridgeShieldFieldView) => void;
};

// Shared leaf presentation for one directional shield segment.
//
// Player and enemy wrappers own:
// - authoritative snapshots;
// - actor/zone validation;
// - field lifecycle.
//
// This leaf owns only:
// - activation fade;
// - idle flicker;
// - final-second blink;
// - blocked-impact flash/fade.
export default class BridgeShieldFieldView {
    private readonly scene: BridgeScene;

    private readonly zone: LaserTargetZone;

    private readonly onImpactComplete: (field: BridgeShieldFieldView) => void;

    private readonly shield: Phaser.GameObjects.Image;

    private remainingDurationMs = 0;
    private initialDurationMs = 0;

    private activationElapsedMs = 0;

    private flickerElapsedMs = 0;
    private flickerOffset = 0;

    private impactElapsedMs?: number;

    private impactStartAlpha: number = SHIELD_FIELD_VFX.baseAlpha;

    private destroyed = false;

    constructor({
        scene,
        parent,
        zone,
        position,
        scale,
        remainingDurationMs,
        initialDurationMs,
        onImpactComplete,
    }: BridgeShieldFieldViewOptions) {
        this.scene = scene;
        this.zone = zone;

        this.onImpactComplete = onImpactComplete;

        const sprite = PLAYER_SHIELD_SPRITES[this.zone];

        this.shield = this.scene.add
            .image(
                position.x,
                position.y,

                sprite.atlasKey,
                sprite.frameKey,
            )
            .setOrigin(0.5, 0.5)
            .setScale(scale)
            .setAlpha(0);

        parent.add(this.shield);

        this.syncLifetime(remainingDurationMs, initialDurationMs);

        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);
    }

    public getZone(): LaserTargetZone {
        return this.zone;
    }

    public setPosition(position: Phaser.Math.Vector2): void {
        this.shield.setPosition(position.x, position.y);
    }

    public syncLifetime(remainingDurationMs: number, initialDurationMs: number): void {
        this.validateLifetime(remainingDurationMs, initialDurationMs);

        this.initialDurationMs = initialDurationMs;

        this.remainingDurationMs = Phaser.Math.Clamp(remainingDurationMs, 0, initialDurationMs);

        this.applyAlpha();
    }

    public isImpactPlaying(): boolean {
        return this.impactElapsedMs !== undefined;
    }

    public playImpact(): void {
        this.impactStartAlpha = this.shield.alpha;

        this.impactElapsedMs = 0;

        this.applyAlpha();
    }

    public destroy(): void {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);

        this.shield.destroy();
    }

    private handleSceneUpdate(_time: number, deltaMs: number): void {
        if (this.destroyed) {
            return;
        }

        if (this.impactElapsedMs !== undefined) {
            this.impactElapsedMs += deltaMs;

            if (this.impactElapsedMs >= this.getImpactDurationMs()) {
                this.onImpactComplete(this);

                return;
            }

            this.applyAlpha();
            return;
        }

        this.activationElapsedMs += deltaMs;

        this.flickerElapsedMs += deltaMs;

        while (this.flickerElapsedMs >= SHIELD_FIELD_VFX.idleFlickerFrameMs) {
            this.flickerElapsedMs -= SHIELD_FIELD_VFX.idleFlickerFrameMs;

            this.flickerOffset = Phaser.Math.FloatBetween(
                -SHIELD_FIELD_VFX.idleFlickerAmplitude,

                SHIELD_FIELD_VFX.idleFlickerAmplitude,
            );
        }

        this.applyAlpha();
    }

    private applyAlpha(): void {
        if (this.destroyed) {
            return;
        }

        if (this.impactElapsedMs !== undefined) {
            this.shield.setAlpha(this.getImpactAlpha());

            return;
        }

        const activationProgress = Phaser.Math.Clamp(
            this.activationElapsedMs / SHIELD_FIELD_VFX.activationFadeMs,

            0,
            1,
        );

        const idleAlpha = Phaser.Math.Clamp(
            SHIELD_FIELD_VFX.baseAlpha + this.flickerOffset,

            0,
            1,
        );

        const activeAlpha = idleAlpha * activationProgress;

        if (this.remainingDurationMs > SHIELD_FIELD_VFX.expirationWarningMs) {
            this.shield.setAlpha(activeAlpha);

            return;
        }

        const warningElapsedMs = SHIELD_FIELD_VFX.expirationWarningMs - this.remainingDurationMs;

        const blinkIndex = Math.floor(warningElapsedMs / SHIELD_FIELD_VFX.expirationBlinkHalfPeriodMs);

        this.shield.setAlpha(blinkIndex % 2 === 0 ? activeAlpha : SHIELD_FIELD_VFX.expirationLowAlpha);
    }

    private getImpactAlpha(): number {
        const impactElapsedMs = this.impactElapsedMs;

        if (impactElapsedMs === undefined) {
            return this.shield.alpha;
        }

        const flashEndMs = SHIELD_FIELD_VFX.impactFlashInMs;

        if (impactElapsedMs < flashEndMs) {
            return Phaser.Math.Linear(
                this.impactStartAlpha,
                1,

                impactElapsedMs / SHIELD_FIELD_VFX.impactFlashInMs,
            );
        }

        const holdEndMs = flashEndMs + SHIELD_FIELD_VFX.impactHoldMs;

        if (impactElapsedMs < holdEndMs) {
            return 1;
        }

        return Phaser.Math.Linear(
            1,
            0,

            Phaser.Math.Clamp(
                (impactElapsedMs - holdEndMs) / SHIELD_FIELD_VFX.impactFadeOutMs,

                0,
                1,
            ),
        );
    }

    private getImpactDurationMs(): number {
        return SHIELD_FIELD_VFX.impactFlashInMs + SHIELD_FIELD_VFX.impactHoldMs + SHIELD_FIELD_VFX.impactFadeOutMs;
    }

    private validateLifetime(remainingDurationMs: number, initialDurationMs: number): void {
        if (!Number.isFinite(initialDurationMs) || initialDurationMs <= 0) {
            throw new Error('Shield initial duration ' + 'must be positive: ' + initialDurationMs);
        }

        if (!Number.isFinite(remainingDurationMs) || remainingDurationMs < 0) {
            throw new Error('Shield remaining duration ' + 'must be non-negative: ' + remainingDurationMs);
        }
    }
}
