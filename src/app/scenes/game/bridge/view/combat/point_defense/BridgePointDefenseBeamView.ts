// src/app/scenes/game/bridge/view/combat/point_defense/BridgePointDefenseBeamView.ts

import {
    POINT_DEFENSE_BEAM_BAND,
    POINT_DEFENSE_SHOT_OUTCOME,
    type PointDefenseBeamBand,
    type PointDefenseShotOutcome,
} from '../../../../../../../engine/defs/point_defense';
import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_VIEWSCREEN_RECT } from '../../bridge_viewscreen_layout';

type BridgePointDefenseBeamViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    beamBand: PointDefenseBeamBand;
    outcome: PointDefenseShotOutcome;

    targetPosition: Phaser.Math.Vector2;

    onComplete: (view: BridgePointDefenseBeamView) => void;
};

type PointDefenseBeamPalette = {
    outer: number;
    inner: number;
};

const POINT_DEFENSE_BEAM_PALETTE = {
    [POINT_DEFENSE_BEAM_BAND.RED]: {
        outer: 0xc9384f,
        inner: 0xff8290,
    },

    [POINT_DEFENSE_BEAM_BAND.BLUE]: {
        outer: 0x2f70c4,
        inner: 0x87ceff,
    },
} satisfies Record<PointDefenseBeamBand, PointDefenseBeamPalette>;

const POINT_DEFENSE_BEAM_PRESENTATION = {
    outerThickness: 6,
    innerThickness: 2,

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
} as const;

// Короткий presentation-effect одного point-defense выстрела.
//
// Не определяет HIT/MISS:
// результат уже разрешён encounter engine.
//
// HIT:
// - один стабильный луч;
// - короткое удержание;
// - fade по alpha.
//
// MISS:
// - три отдельных импульса;
// - каждый получает новую endpoint возле ракеты;
// - каждый быстро гаснет.
export default class BridgePointDefenseBeamView {
    private readonly scene: BridgeScene;

    private readonly parent: Phaser.GameObjects.Container;

    private readonly beamBand: PointDefenseBeamBand;

    private readonly targetPosition: Phaser.Math.Vector2;

    private readonly onComplete: (view: BridgePointDefenseBeamView) => void;

    private readonly activeBeams = new Set<Phaser.GameObjects.Graphics>();

    private readonly timerEvents: Phaser.Time.TimerEvent[] = [];

    private isDestroyed = false;

    constructor({
        scene,
        parent,

        beamBand,
        outcome,

        targetPosition,

        onComplete,
    }: BridgePointDefenseBeamViewOptions) {
        this.scene = scene;
        this.parent = parent;

        this.beamBand = beamBand;

        this.targetPosition = targetPosition.clone();

        this.onComplete = onComplete;

        switch (outcome) {
            case POINT_DEFENSE_SHOT_OUTCOME.HIT:
                this.playHit();
                return;

            case POINT_DEFENSE_SHOT_OUTCOME.MISS:
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
    }

    private playHit(): void {
        const beam = this.createBeam(this.targetPosition);

        this.scene.tweens.add({
            targets: beam,

            alpha: 0,

            delay: POINT_DEFENSE_BEAM_PRESENTATION.hitHoldMs,

            duration: POINT_DEFENSE_BEAM_PRESENTATION.hitFadeMs,

            ease: 'Linear',

            onComplete: () => {
                this.destroyBeam(beam);
                this.complete();
            },
        });
    }

    private playMiss(): void {
        for (let pulseIndex = 0; pulseIndex < POINT_DEFENSE_BEAM_PRESENTATION.missPulseCount; pulseIndex += 1) {
            const timerEvent = this.scene.time.delayedCall(
                pulseIndex * POINT_DEFENSE_BEAM_PRESENTATION.missPulseIntervalMs,

                () => {
                    if (this.isDestroyed) {
                        return;
                    }

                    const beam = this.createBeam(this.createMissTargetPosition());

                    this.scene.tweens.add({
                        targets: beam,

                        alpha: 0,

                        duration: POINT_DEFENSE_BEAM_PRESENTATION.missPulseFadeMs,

                        ease: 'Linear',

                        onComplete: () => {
                            this.destroyBeam(beam);

                            if (pulseIndex === POINT_DEFENSE_BEAM_PRESENTATION.missPulseCount - 1) {
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

        const palette = POINT_DEFENSE_BEAM_PALETTE[this.beamBand];

        const graphics = this.scene.add.graphics();

        // Луч находится под missile sprites,
        // но поверх encounter objects.
        this.parent.addAt(graphics, 0);

        graphics.lineStyle(POINT_DEFENSE_BEAM_PRESENTATION.outerThickness, palette.outer, 1);

        graphics.lineBetween(
            Math.round(startPosition.x),
            Math.round(startPosition.y),

            Math.round(targetPosition.x),
            Math.round(targetPosition.y),
        );

        graphics.lineStyle(POINT_DEFENSE_BEAM_PRESENTATION.innerThickness, palette.inner, 1);

        graphics.lineBetween(
            Math.round(startPosition.x),
            Math.round(startPosition.y),

            Math.round(targetPosition.x),
            Math.round(targetPosition.y),
        );

        this.activeBeams.add(graphics);

        return graphics;
    }

    private createStartPosition(targetPosition: Phaser.Math.Vector2): Phaser.Math.Vector2 {
        const viewscreenCenterX = BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width / 2;

        // Стреляем с противоположной стороны нижней
        // границы, чтобы луч хорошо читался.
        const startX =
            targetPosition.x < viewscreenCenterX
                ? BRIDGE_VIEWSCREEN_RECT.x +
                  BRIDGE_VIEWSCREEN_RECT.width -
                  POINT_DEFENSE_BEAM_PRESENTATION.viewscreenInset
                : BRIDGE_VIEWSCREEN_RECT.x + POINT_DEFENSE_BEAM_PRESENTATION.viewscreenInset;

        return new Phaser.Math.Vector2(
            startX,

            BRIDGE_VIEWSCREEN_RECT.y +
                BRIDGE_VIEWSCREEN_RECT.height +
                POINT_DEFENSE_BEAM_PRESENTATION.startBottomOffset,
        );
    }

    private createMissTargetPosition(): Phaser.Math.Vector2 {
        const left = BRIDGE_VIEWSCREEN_RECT.x + POINT_DEFENSE_BEAM_PRESENTATION.viewscreenInset;

        const right =
            BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width - POINT_DEFENSE_BEAM_PRESENTATION.viewscreenInset;

        const top = BRIDGE_VIEWSCREEN_RECT.y + POINT_DEFENSE_BEAM_PRESENTATION.viewscreenInset;

        const bottom =
            BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height - POINT_DEFENSE_BEAM_PRESENTATION.viewscreenInset;

        for (let attempt = 0; attempt < POINT_DEFENSE_BEAM_PRESENTATION.missCandidateAttempts; attempt += 1) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

            const distance = Phaser.Math.Between(
                POINT_DEFENSE_BEAM_PRESENTATION.missOffsetMin,

                POINT_DEFENSE_BEAM_PRESENTATION.missOffsetMax,
            );

            const candidate = new Phaser.Math.Vector2(
                Phaser.Math.Clamp(Math.round(this.targetPosition.x + Math.cos(angle) * distance), left, right),

                Phaser.Math.Clamp(Math.round(this.targetPosition.y + Math.sin(angle) * distance), top, bottom),
            );

            const resolvedDistance = Math.hypot(
                candidate.x - this.targetPosition.x,
                candidate.y - this.targetPosition.y,
            );

            if (resolvedDistance >= POINT_DEFENSE_BEAM_PRESENTATION.missOffsetMin * 0.75) {
                return candidate;
            }
        }

        // Fallback для цели возле края viewscreen.
        const horizontalDirection =
            this.targetPosition.x < BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width / 2 ? 1 : -1;

        return new Phaser.Math.Vector2(
            Phaser.Math.Clamp(
                this.targetPosition.x + horizontalDirection * POINT_DEFENSE_BEAM_PRESENTATION.missOffsetMin,
                left,
                right,
            ),

            Phaser.Math.Clamp(this.targetPosition.y - POINT_DEFENSE_BEAM_PRESENTATION.missOffsetMin / 2, top, bottom),
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
        throw new Error(`Unhandled point-defense outcome: ${String(value)}`);
    }
}
