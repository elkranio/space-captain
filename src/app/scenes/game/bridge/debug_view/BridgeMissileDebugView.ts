// src/app/scenes/game/bridge/debug_view/BridgeMissileDebugView.ts
import type BridgeScene from '../BridgeScene';
import { BRIDGE_MISSILE_DEBUG_CONFIG, type BridgeMissileDebugPoint } from './bridge_missile_debug_config';

type FlightState = {
    timeProgress: number;
};

type MissileTrajectoryId = '1' | '2' | '3' | '4' | '5';

export default class BridgeMissileDebugView {
    private graphics?: Phaser.GameObjects.Graphics;
    private flightTween?: Phaser.Tweens.Tween;

    private activeTrajectoryId?: MissileTrajectoryId;

    private readonly trailPoints: BridgeMissileDebugPoint[] = [];

    constructor(private readonly scene: BridgeScene) {
        this.scene.input.keyboard?.on('keydown', this.handleKeyDown, this);
    }

    public destroy(): void {
        this.scene.input.keyboard?.off('keydown', this.handleKeyDown, this);

        this.clearFlight();
    }

    private handleKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                this.launch(event.key);
                return;

            default:
                return;
        }
    }

    private launch(trajectoryId: MissileTrajectoryId): void {
        this.clearFlight();
        this.activeTrajectoryId = trajectoryId;

        this.graphics = this.scene.add.graphics();

        this.scene.layers.get('vfx').add(this.graphics);

        const flightState: FlightState = {
            timeProgress: 0,
        };

        this.updateFlight(0);

        this.flightTween = this.scene.tweens.add({
            targets: flightState,
            timeProgress: 1,
            duration: BRIDGE_MISSILE_DEBUG_CONFIG.durationMs,
            ease: 'Linear',

            onUpdate: () => {
                this.updateFlight(flightState.timeProgress);
            },

            onComplete: () => {
                this.completeFlight();
            },
        });
    }

    private updateFlight(timeProgress: number): void {
        if (!this.graphics) {
            return;
        }

        const clampedTimeProgress = Phaser.Math.Clamp(timeProgress, 0, 1);

        const pathProgress = this.mapTimeToPathProgress(clampedTimeProgress);

        const point = this.getBezierPoint(pathProgress);

        this.pushTrailPoint(point);
        this.renderFlight(point, pathProgress);
    }

    private mapTimeToPathProgress(timeProgress: number): number {
        const motion = BRIDGE_MISSILE_DEBUG_CONFIG.motion;

        if (timeProgress < motion.terminalStartTimeProgress) {
            const local = timeProgress / motion.terminalStartTimeProgress;

            const acceleratedCruise =
                motion.cruiseLinearWeight * local + (1 - motion.cruiseLinearWeight) * local * local;

            return motion.terminalStartPathProgress * acceleratedCruise;
        }

        const local = (timeProgress - motion.terminalStartTimeProgress) / (1 - motion.terminalStartTimeProgress);

        const terminalRush =
            motion.terminalLinearWeight * local + (1 - motion.terminalLinearWeight) * local * local * local;

        return Phaser.Math.Linear(motion.terminalStartPathProgress, 1, terminalRush);
    }

    private pushTrailPoint(point: BridgeMissileDebugPoint): void {
        const trailConfig = BRIDGE_MISSILE_DEBUG_CONFIG.trail;

        const previousPoint = this.trailPoints[this.trailPoints.length - 1];

        if (previousPoint) {
            const distance = Phaser.Math.Distance.Between(previousPoint.x, previousPoint.y, point.x, point.y);

            if (distance < trailConfig.minParticleSpacingPx) {
                return;
            }
        }

        this.trailPoints.push({
            x: point.x,
            y: point.y,
        });

        const maxCount = trailConfig.maxParticleCount;

        while (this.trailPoints.length > maxCount) {
            this.trailPoints.shift();
        }
    }

    private renderFlight(missilePoint: BridgeMissileDebugPoint, pathProgress: number): void {
        if (!this.graphics) {
            return;
        }

        const graphics = this.graphics;
        const trailConfig = BRIDGE_MISSILE_DEBUG_CONFIG.trail;
        const missileConfig = BRIDGE_MISSILE_DEBUG_CONFIG.missile;

        graphics.clear();

        const depth = pathProgress * pathProgress;

        const particleCount = Math.round(
            Phaser.Math.Linear(trailConfig.minParticleCount, trailConfig.maxParticleCount, depth),
        );

        const visibleStartIndex = Math.max(0, this.trailPoints.length - particleCount);

        const visiblePoints = this.trailPoints.slice(visibleStartIndex);

        for (let index = 0; index < visiblePoints.length; index += 1) {
            const point = visiblePoints[index];

            const ageProgress = visiblePoints.length <= 1 ? 1 : index / (visiblePoints.length - 1);

            const particleSize = Phaser.Math.Linear(
                trailConfig.minParticleSize,
                trailConfig.maxParticleSize,
                depth * ageProgress,
            );

            const alpha = Phaser.Math.Linear(trailConfig.minAlpha, trailConfig.maxAlpha, depth * ageProgress);

            const color = ageProgress > 0.66 ? trailConfig.hotColor : trailConfig.coolColor;

            graphics.fillStyle(color, alpha);

            graphics.fillRect(
                Math.round(point.x - particleSize / 2),
                Math.round(point.y - particleSize / 2),
                Math.max(1, Math.round(particleSize)),
                Math.max(1, Math.round(particleSize)),
            );
        }

        const missileSize = Math.max(
            1,
            Math.round(Phaser.Math.Linear(missileConfig.minPixelSize, missileConfig.maxPixelSize, depth)),
        );

        graphics.fillStyle(missileConfig.color, 1);

        graphics.fillRect(
            Math.round(missilePoint.x - missileSize / 2),
            Math.round(missilePoint.y - missileSize / 2),
            missileSize,
            missileSize,
        );
    }

    private getBezierPoint(progress: number): BridgeMissileDebugPoint {
        const config = BRIDGE_MISSILE_DEBUG_CONFIG;

        const trajectory = this.getActiveTrajectory();

        const start = config.start;
        const control1 = trajectory.control1;
        const control2 = trajectory.control2;
        const end = trajectory.end;

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

    private getActiveTrajectory() {
        if (!this.activeTrajectoryId) {
            throw new Error('Missile debug trajectory is not selected');
        }

        return BRIDGE_MISSILE_DEBUG_CONFIG.trajectories[this.activeTrajectoryId];
    }

    private completeFlight(): void {
        const config = BRIDGE_MISSILE_DEBUG_CONFIG.impact;

        const trajectory = this.getActiveTrajectory();

        this.flightTween = undefined;

        this.graphics?.destroy();
        this.graphics = undefined;

        this.trailPoints.length = 0;

        const flash = this.scene.add.circle(
            trajectory.end.x,
            trajectory.end.y,
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

        this.scene.cameras.main.shake(config.shakeDurationMs, config.shakeIntensity);
    }

    private clearFlight(): void {
        this.flightTween?.stop();
        this.flightTween = undefined;

        this.graphics?.destroy();
        this.graphics = undefined;

        this.trailPoints.length = 0;
        this.activeTrajectoryId = undefined;
    }
}
