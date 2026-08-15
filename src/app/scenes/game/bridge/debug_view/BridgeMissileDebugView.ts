import { PerspectiveImage } from 'phaser3-rex-plugins/plugins/perspectiveimage.js';
import type BridgeScene from '../BridgeScene';
import {
    BRIDGE_MISSILE_DEBUG_CONFIG,
    type BridgeMissileDebugPoint,
} from './bridge_missile_debug_config';

type FlightState = {
    timeProgress: number;
};

export default class BridgeMissileDebugView {
    private missile?: PerspectiveImage;
    private trail?: Phaser.GameObjects.Graphics;
    private flightTween?: Phaser.Tweens.Tween;

    private readonly trailPoints: BridgeMissileDebugPoint[] = [];

    constructor(private readonly scene: BridgeScene) {
        this.scene.input.keyboard?.on(
            'keydown-M',
            this.launch,
            this,
        );
    }

    public destroy(): void {
        this.scene.input.keyboard?.off(
            'keydown-M',
            this.launch,
            this,
        );

        this.clearFlight();
    }

    private launch(): void {
        this.clearFlight();

        const config = BRIDGE_MISSILE_DEBUG_CONFIG;
        const frame = this.scene.textures.getFrame(
            config.textureKey,
            config.frameKey,
        );

        if (!frame) {
            throw new Error(
                `Bridge missile debug frame not found: ${config.frameKey}`,
            );
        }

        this.trail = this.scene.add.graphics();
        this.scene.layers.get('vfx').add(this.trail);

        const missile = new PerspectiveImage(
            this.scene,
            {
                x: config.start.x,
                y: config.start.y,

                key: config.textureKey,
                frame: config.frameKey,

                hideCCW: false,
                gridWidth: config.missile.gridWidth,
            },
        );

        this.scene.add.existing(missile);
        this.scene.layers.get('vfx').add(missile);

        const initialScale =
            config.missile.initialDisplayWidth /
            Math.max(frame.width, 1);

        missile.setScale(initialScale);

        this.missile = missile;

        const flightState: FlightState = {
            timeProgress: 0,
        };

        this.updateFlight(0, initialScale);

        this.flightTween = this.scene.tweens.add({
            targets: flightState,
            timeProgress: 1,
            duration: config.durationMs,
            ease: 'Linear',

            onUpdate: () => {
                this.updateFlight(
                    flightState.timeProgress,
                    initialScale,
                );
            },

            onComplete: () => {
                this.completeFlight();
            },
        });
    }

    private updateFlight(
        timeProgress: number,
        initialScale: number,
    ): void {
        if (!this.missile) {
            return;
        }

        const pathProgress =
            this.mapTimeToPathProgress(
                Phaser.Math.Clamp(timeProgress, 0, 1),
            );

        const point = this.getBezierPoint(pathProgress);
        const tangent = this.getBezierTangent(pathProgress);

        this.missile.setPosition(point.x, point.y);

        const terminalScaleStart =
            BRIDGE_MISSILE_DEBUG_CONFIG
                .missile
                .terminalScaleStartPathProgress;

        const terminalProgress = Phaser.Math.Clamp(
            (pathProgress - terminalScaleStart) /
                (1 - terminalScaleStart),
            0,
            1,
        );

        const terminalEase =
            terminalProgress * terminalProgress * terminalProgress;

        const scaleMultiplier = Phaser.Math.Linear(
            1,
            BRIDGE_MISSILE_DEBUG_CONFIG.missile.maxScaleMultiplier,
            terminalEase,
        );

        this.missile.setScale(
            initialScale * scaleMultiplier,
        );

        const tangentAngleDeg =
            Phaser.Math.RadToDeg(
                Math.atan2(tangent.y, tangent.x),
            );

        this.missile.angleX =
            Phaser.Math.Linear(
                0,
                BRIDGE_MISSILE_DEBUG_CONFIG.missile.terminalPitchDeg,
                terminalEase,
            );

        this.missile.angleY =
            Phaser.Math.Linear(
                0,
                BRIDGE_MISSILE_DEBUG_CONFIG.missile.terminalYawDeg,
                terminalEase,
            );

        this.missile.angleZ =
            tangentAngleDeg +
            BRIDGE_MISSILE_DEBUG_CONFIG
                .missile
                .forwardAngleOffsetDeg;

        this.pushTrailPoint(point);
        this.renderTrail();
    }

    private mapTimeToPathProgress(timeProgress: number): number {
        if (timeProgress < 0.08) {
            const local = timeProgress / 0.08;

            return Phaser.Math.Linear(
                0,
                0.09,
                this.easeOutCubic(local),
            );
        }

        if (timeProgress < 0.72) {
            const local = (timeProgress - 0.08) / 0.64;

            return Phaser.Math.Linear(
                0.09,
                0.28,
                this.easeInOutSine(local),
            );
        }

        if (timeProgress < 0.94) {
            const local = (timeProgress - 0.72) / 0.22;

            return Phaser.Math.Linear(
                0.28,
                0.63,
                local * local,
            );
        }

        const local = (timeProgress - 0.94) / 0.06;

        return Phaser.Math.Linear(
            0.63,
            1,
            local * local * local,
        );
    }

    private getBezierPoint(
        progress: number,
    ): BridgeMissileDebugPoint {
        const config = BRIDGE_MISSILE_DEBUG_CONFIG;
        const start = config.start;
        const control1 = config.curve.control1;
        const control2 = config.curve.control2;
        const end = config.curve.end;

        const inverse = 1 - progress;
        const inverseSquared = inverse * inverse;
        const progressSquared = progress * progress;

        return {
            x:
                inverseSquared * inverse * start.x +
                3 * inverseSquared * progress * control1.x +
                3 * inverse * progressSquared * control2.x +
                progressSquared * progress * end.x,

            y:
                inverseSquared * inverse * start.y +
                3 * inverseSquared * progress * control1.y +
                3 * inverse * progressSquared * control2.y +
                progressSquared * progress * end.y,
        };
    }

    private getBezierTangent(
        progress: number,
    ): BridgeMissileDebugPoint {
        const config = BRIDGE_MISSILE_DEBUG_CONFIG;
        const start = config.start;
        const control1 = config.curve.control1;
        const control2 = config.curve.control2;
        const end = config.curve.end;

        const inverse = 1 - progress;

        return {
            x:
                3 * inverse * inverse * (control1.x - start.x) +
                6 * inverse * progress * (control2.x - control1.x) +
                3 * progress * progress * (end.x - control2.x),

            y:
                3 * inverse * inverse * (control1.y - start.y) +
                6 * inverse * progress * (control2.y - control1.y) +
                3 * progress * progress * (end.y - control2.y),
        };
    }

    private pushTrailPoint(
        point: BridgeMissileDebugPoint,
    ): void {
        this.trailPoints.push({
            x: point.x,
            y: point.y,
        });

        const maxPoints =
            BRIDGE_MISSILE_DEBUG_CONFIG.trail.maxPoints;

        while (this.trailPoints.length > maxPoints) {
            this.trailPoints.shift();
        }
    }

    private renderTrail(): void {
        if (!this.trail) {
            return;
        }

        const config = BRIDGE_MISSILE_DEBUG_CONFIG.trail;

        this.trail.clear();

        for (
            let index = 1;
            index < this.trailPoints.length;
            index += 1
        ) {
            const previous = this.trailPoints[index - 1];
            const current = this.trailPoints[index];
            const progress = index / this.trailPoints.length;

            this.trail.lineStyle(
                Phaser.Math.Linear(
                    config.minWidth,
                    config.maxWidth,
                    progress,
                ),
                config.color,
                config.maxAlpha * progress,
            );

            this.trail.lineBetween(
                previous.x,
                previous.y,
                current.x,
                current.y,
            );
        }
    }

    private completeFlight(): void {
        const config = BRIDGE_MISSILE_DEBUG_CONFIG.impact;

        this.flightTween = undefined;

        this.missile?.destroy();
        this.missile = undefined;

        this.trail?.destroy();
        this.trail = undefined;
        this.trailPoints.length = 0;

        const flash = this.scene.add.circle(
            config.flashX,
            config.flashY,
            config.flashRadius,
            config.flashColor,
            0.85,
        );

        this.scene.layers.get('vfx').add(flash);

        this.scene.tweens.add({
            targets: flash,
            scale: config.flashScale,
            alpha: 0,
            duration: config.flashDurationMs,
            ease: 'Quad.Out',

            onComplete: () => {
                flash.destroy();
            },
        });

        this.scene.cameras.main.shake(
            config.shakeDurationMs,
            config.shakeIntensity,
        );
    }

    private clearFlight(): void {
        this.flightTween?.stop();
        this.flightTween = undefined;

        this.missile?.destroy();
        this.missile = undefined;

        this.trail?.destroy();
        this.trail = undefined;

        this.trailPoints.length = 0;
    }

    private easeOutCubic(value: number): number {
        const inverse = 1 - value;
        return 1 - inverse * inverse * inverse;
    }

    private easeInOutSine(value: number): number {
        return -(Math.cos(Math.PI * value) - 1) / 2;
    }
}
