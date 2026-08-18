// src/app/scenes/game/bridge/view/combat/defense_turret/BridgeDefenseTurretBeamView.ts

import {
    DEFENSE_TURRET_SHOT_OUTCOME,
    type DefenseTurretShotOutcome,
} from "../../../../../../../engine/defs/defense_turret";
import type BridgeScene from "../../../BridgeScene";
import { BRIDGE_VIEWSCREEN_RECT } from "../../bridge_viewscreen_layout";

type BridgeDefenseTurretBeamViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    outcome: DefenseTurretShotOutcome;

    // Player Defense Turret omits this and uses the existing bridge-edge source.
    // Enemy Defense Turret passes the firing actor position explicitly.
    sourcePosition?: Phaser.Math.Vector2;

    targetPosition: Phaser.Math.Vector2;

    onComplete: (view: BridgeDefenseTurretBeamView) => void;
};

const DEFENSE_TURRET_BEAM_PALETTE = {
    outer: 0x4f84a8,
    inner: 0xb8e6ff,

    particleHot: 0xffd36a,
    particleCool: 0xf7fbff,
} as const;

const DEFENSE_TURRET_BEAM_PRESENTATION = {
    outerThickness: 3,
    innerThickness: 1,

    hitHoldMs: 80,
    hitFadeMs: 220,

    missPulseCount: 3,
    missPulseIntervalMs: 130,
    missPulseFadeMs: 70,

    missOffsetMin: 38,
    missOffsetMax: 72,
    missCandidateAttempts: 8,

    viewscreenInset: 12,
    startBottomOffset: 8,

    hitParticleCount: 8,
    hitParticleDistanceMin: 14,
    hitParticleDistanceMax: 30,
    hitParticleSizeMin: 1,
    hitParticleSizeMax: 3,
    hitParticleDurationMinMs: 160,
    hitParticleDurationMaxMs: 240,
    hitParticleAngleJitter: 0.22,
} as const;

// Short presentation effect of one defense-turret shot.
// Player and enemy Defense Turrets use the same neutral visual language.
// HIT/MISS has already been resolved by the encounter engine.
export default class BridgeDefenseTurretBeamView {
    private readonly scene: BridgeScene;

    private readonly parent: Phaser.GameObjects.Container;

    private readonly sourcePosition?: Phaser.Math.Vector2;

    private readonly targetPosition: Phaser.Math.Vector2;

    private readonly onComplete: (view: BridgeDefenseTurretBeamView) => void;

    private readonly activeBeams = new Set<Phaser.GameObjects.Graphics>();

    private readonly activeHitParticles = new Set<Phaser.GameObjects.Rectangle>();

    private readonly timerEvents: Phaser.Time.TimerEvent[] = [];

    private isDestroyed = false;

    constructor({
        scene,
        parent,
        outcome,
        sourcePosition,
        targetPosition,
        onComplete,
    }: BridgeDefenseTurretBeamViewOptions) {
        this.scene = scene;
        this.parent = parent;

        this.sourcePosition = sourcePosition?.clone();

        this.targetPosition = targetPosition.clone();

        this.onComplete = onComplete;

        switch (outcome) {
            case DEFENSE_TURRET_SHOT_OUTCOME.HIT:
                this.playHit();
                return;

            case DEFENSE_TURRET_SHOT_OUTCOME.MISS:
                this.playMiss();
                return;

            default:
                return this.assertNever(outcome);
        }
    }

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        for (const timerEvent of this.timerEvents) {
            timerEvent.remove(false);
        }

        this.timerEvents.length = 0;

        for (const beam of [...this.activeBeams]) {
            this.destroyBeam(beam);
        }

        this.activeBeams.clear();

        for (const particle of [...this.activeHitParticles]) {
            this.destroyHitParticle(particle);
        }

        this.activeHitParticles.clear();
    }

    private playHit(): void {
        const beam = this.createBeam(this.targetPosition);

        this.createHitParticles();

        this.scene.tweens.add({
            targets: beam,
            alpha: 0,

            delay: DEFENSE_TURRET_BEAM_PRESENTATION.hitHoldMs,

            duration: DEFENSE_TURRET_BEAM_PRESENTATION.hitFadeMs,

            ease: "Linear",

            onComplete: () => {
                this.destroyBeam(beam);
                this.complete();
            },
        });
    }

    private playMiss(): void {
        for (let pulseIndex = 0; pulseIndex < DEFENSE_TURRET_BEAM_PRESENTATION.missPulseCount; pulseIndex += 1) {
            const timerEvent = this.scene.time.delayedCall(
                pulseIndex * DEFENSE_TURRET_BEAM_PRESENTATION.missPulseIntervalMs,

                () => {
                    if (this.isDestroyed) {
                        return;
                    }

                    const beam = this.createBeam(this.createMissTargetPosition());

                    this.scene.tweens.add({
                        targets: beam,

                        alpha: 0,

                        duration: DEFENSE_TURRET_BEAM_PRESENTATION.missPulseFadeMs,

                        ease: "Linear",

                        onComplete: () => {
                            this.destroyBeam(beam);

                            if (pulseIndex === DEFENSE_TURRET_BEAM_PRESENTATION.missPulseCount - 1) {
                                this.complete();
                            }
                        },
                    });
                },
            );

            this.timerEvents.push(timerEvent);
        }
    }

    private createBeam(targetPosition: Phaser.Math.Vector2): Phaser.GameObjects.Graphics {
        const startPosition = this.createStartPosition(targetPosition);

        const graphics = this.scene.add.graphics();

        this.parent.addAt(graphics, 0);

        graphics.lineStyle(
            DEFENSE_TURRET_BEAM_PRESENTATION.outerThickness,

            DEFENSE_TURRET_BEAM_PALETTE.outer,

            1,
        );

        graphics.lineBetween(
            Math.round(startPosition.x),
            Math.round(startPosition.y),

            Math.round(targetPosition.x),
            Math.round(targetPosition.y),
        );

        graphics.lineStyle(
            DEFENSE_TURRET_BEAM_PRESENTATION.innerThickness,

            DEFENSE_TURRET_BEAM_PALETTE.inner,

            1,
        );

        graphics.lineBetween(
            Math.round(startPosition.x),
            Math.round(startPosition.y),

            Math.round(targetPosition.x),
            Math.round(targetPosition.y),
        );

        this.activeBeams.add(graphics);

        return graphics;
    }

    private createHitParticles(): void {
        const presentation = DEFENSE_TURRET_BEAM_PRESENTATION;

        const angleStep = (Math.PI * 2) / presentation.hitParticleCount;

        for (let particleIndex = 0; particleIndex < presentation.hitParticleCount; particleIndex += 1) {
            const angle =
                angleStep * particleIndex +
                Phaser.Math.FloatBetween(-presentation.hitParticleAngleJitter, presentation.hitParticleAngleJitter);

            const distance = Phaser.Math.Between(
                presentation.hitParticleDistanceMin,
                presentation.hitParticleDistanceMax,
            );

            const size = Phaser.Math.Between(presentation.hitParticleSizeMin, presentation.hitParticleSizeMax);

            const color =
                particleIndex % 2 === 0
                    ? DEFENSE_TURRET_BEAM_PALETTE.particleHot
                    : DEFENSE_TURRET_BEAM_PALETTE.particleCool;

            const particle = this.scene.add.rectangle(
                this.targetPosition.x,
                this.targetPosition.y,
                size,
                size,
                color,
                1,
            );

            this.parent.add(particle);

            this.activeHitParticles.add(particle);

            this.scene.tweens.add({
                targets: particle,

                x: this.targetPosition.x + Math.cos(angle) * distance,

                y: this.targetPosition.y + Math.sin(angle) * distance,

                alpha: 0,
                scale: 0.5,

                duration: Phaser.Math.Between(
                    presentation.hitParticleDurationMinMs,
                    presentation.hitParticleDurationMaxMs,
                ),

                ease: "Quad.Out",

                onComplete: () => {
                    this.destroyHitParticle(particle);
                },
            });
        }
    }

    private destroyHitParticle(particle: Phaser.GameObjects.Rectangle): void {
        if (!this.activeHitParticles.delete(particle)) {
            return;
        }

        this.scene.tweens.killTweensOf(particle);

        particle.destroy();
    }

    private createStartPosition(targetPosition: Phaser.Math.Vector2): Phaser.Math.Vector2 {
        if (this.sourcePosition) {
            return this.sourcePosition.clone();
        }

        const viewscreenCenterX = BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width / 2;

        const startX =
            targetPosition.x < viewscreenCenterX
                ? BRIDGE_VIEWSCREEN_RECT.x +
                  BRIDGE_VIEWSCREEN_RECT.width -
                  DEFENSE_TURRET_BEAM_PRESENTATION.viewscreenInset
                : BRIDGE_VIEWSCREEN_RECT.x + DEFENSE_TURRET_BEAM_PRESENTATION.viewscreenInset;

        return new Phaser.Math.Vector2(
            startX,

            BRIDGE_VIEWSCREEN_RECT.y +
                BRIDGE_VIEWSCREEN_RECT.height +
                DEFENSE_TURRET_BEAM_PRESENTATION.startBottomOffset,
        );
    }

    private createMissTargetPosition(): Phaser.Math.Vector2 {
        const left = BRIDGE_VIEWSCREEN_RECT.x + DEFENSE_TURRET_BEAM_PRESENTATION.viewscreenInset;

        const right =
            BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width - DEFENSE_TURRET_BEAM_PRESENTATION.viewscreenInset;

        const top = BRIDGE_VIEWSCREEN_RECT.y + DEFENSE_TURRET_BEAM_PRESENTATION.viewscreenInset;

        const bottom =
            BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height - DEFENSE_TURRET_BEAM_PRESENTATION.viewscreenInset;

        for (let attempt = 0; attempt < DEFENSE_TURRET_BEAM_PRESENTATION.missCandidateAttempts; attempt += 1) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

            const distance = Phaser.Math.Between(
                DEFENSE_TURRET_BEAM_PRESENTATION.missOffsetMin,

                DEFENSE_TURRET_BEAM_PRESENTATION.missOffsetMax,
            );

            const candidate = new Phaser.Math.Vector2(
                Phaser.Math.Clamp(Math.round(this.targetPosition.x + Math.cos(angle) * distance), left, right),

                Phaser.Math.Clamp(Math.round(this.targetPosition.y + Math.sin(angle) * distance), top, bottom),
            );

            const resolvedDistance = Math.hypot(
                candidate.x - this.targetPosition.x,

                candidate.y - this.targetPosition.y,
            );

            if (resolvedDistance >= DEFENSE_TURRET_BEAM_PRESENTATION.missOffsetMin * 0.75) {
                return candidate;
            }
        }

        const horizontalDirection =
            this.targetPosition.x < BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width / 2 ? 1 : -1;

        return new Phaser.Math.Vector2(
            Phaser.Math.Clamp(
                this.targetPosition.x + horizontalDirection * DEFENSE_TURRET_BEAM_PRESENTATION.missOffsetMin,

                left,
                right,
            ),

            Phaser.Math.Clamp(
                this.targetPosition.y - DEFENSE_TURRET_BEAM_PRESENTATION.missOffsetMin / 2,

                top,
                bottom,
            ),
        );
    }

    private destroyBeam(beam: Phaser.GameObjects.Graphics): void {
        if (!this.activeBeams.delete(beam)) {
            return;
        }

        this.scene.tweens.killTweensOf(beam);

        beam.destroy();
    }

    private complete(): void {
        if (this.isDestroyed) {
            return;
        }

        this.destroy();

        this.onComplete(this);
    }

    private assertNever(value: never): never {
        throw new Error("Unhandled defense-turret outcome: " + String(value));
    }
}
