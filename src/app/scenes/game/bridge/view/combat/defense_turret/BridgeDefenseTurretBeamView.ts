// src/app/scenes/game/bridge/view/combat/defense_turret/BridgeDefenseTurretBeamView.ts

import {
    DEFENSE_TURRET_SIGNATURE,
    DEFENSE_TURRET_SHOT_OUTCOME,
    type DefenseTurretSignature,
    type DefenseTurretShotOutcome,
} from '../../../../../../../engine/defs/defense_turret';
import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_VIEWSCREEN_RECT } from '../../bridge_viewscreen_layout';

type BridgeDefenseTurretBeamViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    signature: DefenseTurretSignature;
    outcome: DefenseTurretShotOutcome;

    // Player PD omits this and uses the existing bridge-edge source.
    // Enemy PD passes the firing actor position explicitly.
    sourcePosition?: Phaser.Math.Vector2;

    targetPosition: Phaser.Math.Vector2;

    onComplete: (view: BridgeDefenseTurretBeamView) => void;
};

type DefenseTurretBeamPalette = {
    outer: number;
    inner: number;
};

const DEFENSE_TURRET_BEAM_PALETTE = {
    [DEFENSE_TURRET_SIGNATURE.A]: {
        outer: 0xc9384f,
        inner: 0xff8290,
    },

    [DEFENSE_TURRET_SIGNATURE.B]: {
        outer: 0x2f70c4,
        inner: 0x87ceff,
    },
} satisfies Record<DefenseTurretSignature, DefenseTurretBeamPalette>;

const DEFENSE_TURRET_BEAM_PRESENTATION = {
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

// Короткий presentation-effect одного defense-turret выстрела.
//
// Player и enemy PD используют один visual language.
// Отличается только explicit/default source position.
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
export default class BridgeDefenseTurretBeamView {
    private readonly scene: BridgeScene;

    private readonly parent: Phaser.GameObjects.Container;

    private readonly signature: DefenseTurretSignature;

    private readonly sourcePosition?:
        Phaser.Math.Vector2;

    private readonly targetPosition: Phaser.Math.Vector2;

    private readonly onComplete: (view: BridgeDefenseTurretBeamView) => void;

    private readonly activeBeams = new Set<Phaser.GameObjects.Graphics>();

    private readonly timerEvents: Phaser.Time.TimerEvent[] = [];

    private isDestroyed = false;

    constructor({
        scene,
        parent,

        signature,
        outcome,

        sourcePosition,
        targetPosition,

        onComplete,
    }: BridgeDefenseTurretBeamViewOptions) {
        this.scene = scene;
        this.parent = parent;

        this.signature = signature;

        this.sourcePosition =
            sourcePosition?.clone();

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
    }

    private playHit(): void {
        const beam = this.createBeam(this.targetPosition);

        this.scene.tweens.add({
            targets: beam,

            alpha: 0,

            delay: DEFENSE_TURRET_BEAM_PRESENTATION.hitHoldMs,

            duration: DEFENSE_TURRET_BEAM_PRESENTATION.hitFadeMs,

            ease: 'Linear',

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

                        ease: 'Linear',

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

        const palette = DEFENSE_TURRET_BEAM_PALETTE[this.signature];

        const graphics = this.scene.add.graphics();

        // Луч находится под missile sprites,
        // но поверх encounter objects.
        this.parent.addAt(graphics, 0);

        graphics.lineStyle(DEFENSE_TURRET_BEAM_PRESENTATION.outerThickness, palette.outer, 1);

        graphics.lineBetween(
            Math.round(startPosition.x),
            Math.round(startPosition.y),

            Math.round(targetPosition.x),
            Math.round(targetPosition.y),
        );

        graphics.lineStyle(DEFENSE_TURRET_BEAM_PRESENTATION.innerThickness, palette.inner, 1);

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
        if (this.sourcePosition) {
            return this.sourcePosition.clone();
        }

        const viewscreenCenterX = BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width / 2;

        // Стреляем с противоположной стороны нижней
        // границы, чтобы луч хорошо читался.
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

        // Fallback для цели возле края viewscreen.
        const horizontalDirection =
            this.targetPosition.x < BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width / 2 ? 1 : -1;

        return new Phaser.Math.Vector2(
            Phaser.Math.Clamp(
                this.targetPosition.x + horizontalDirection * DEFENSE_TURRET_BEAM_PRESENTATION.missOffsetMin,
                left,
                right,
            ),

            Phaser.Math.Clamp(this.targetPosition.y - DEFENSE_TURRET_BEAM_PRESENTATION.missOffsetMin / 2, top, bottom),
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
        throw new Error(`Unhandled defense-turret outcome: ${String(value)}`);
    }
}
