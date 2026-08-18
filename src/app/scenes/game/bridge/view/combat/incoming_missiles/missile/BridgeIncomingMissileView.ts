// src/app/scenes/game/bridge/view/combat/incoming_missiles/missile/BridgeIncomingMissileView.ts

import type BridgeScene from "../../../../BridgeScene";
import {
    BRIDGE_INCOMING_MISSILE_PRESENTATION,
    type BridgeIncomingMissilePoint,
} from "./bridge_incoming_missile_presentation";

type BridgeIncomingMissileViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    projectileId: string;

    startPosition: Phaser.Math.Vector2;

    initialTimeToImpactMs: number;
};

// Leaf-view одной входящей ракеты.
//
// Engine остаётся единственным источником времени.
// View при создании один раз выбирает visual trajectory
// и небольшой immutable waypoint jitter.
//
// Каждый update переводит engine time в normalized progress,
// затем в visual path progress. Поэтому одинаковая траектория
// сохраняет тот же speed profile при любой длительности полёта.
export default class BridgeIncomingMissileView {
    private readonly graphics: Phaser.GameObjects.Graphics;

    private readonly initialTimeToImpactMs: number;

    private readonly trajectoryPoints: BridgeIncomingMissilePoint[];

    private readonly trailPoints: BridgeIncomingMissilePoint[] = [];

    private readonly currentPosition = new Phaser.Math.Vector2();

    constructor({
        scene,
        parent,

        projectileId,

        startPosition,

        initialTimeToImpactMs,
    }: BridgeIncomingMissileViewOptions) {
        if (initialTimeToImpactMs <= 0) {
            throw new Error("Incoming missile initial time must be positive: " + projectileId);
        }

        this.initialTimeToImpactMs = initialTimeToImpactMs;

        this.trajectoryPoints = this.createTrajectoryPoints(startPosition);

        this.currentPosition.copy(startPosition);

        this.graphics = scene.add.graphics();

        parent.add(this.graphics);

        this.update(initialTimeToImpactMs);
    }

    public update(timeToImpactMs: number): void {
        const timeProgress = this.getTimeProgress(timeToImpactMs);

        const pathProgress = this.mapTimeToPathProgress(timeProgress);

        const point = this.getTrajectoryPoint(pathProgress);

        this.currentPosition.set(point.x, point.y);

        this.pushTrailPoint(point);

        this.render(point, pathProgress);
    }

    public getPosition(): Phaser.Math.Vector2 {
        return this.currentPosition.clone();
    }

    public destroy(): void {
        this.trailPoints.length = 0;
        this.graphics.destroy();
    }

    private getTimeProgress(timeToImpactMs: number): number {
        const clampedRemainingMs = Phaser.Math.Clamp(timeToImpactMs, 0, this.initialTimeToImpactMs);

        return 1 - clampedRemainingMs / this.initialTimeToImpactMs;
    }

    private mapTimeToPathProgress(timeProgress: number): number {
        const motion = BRIDGE_INCOMING_MISSILE_PRESENTATION.motion;

        if (timeProgress < motion.terminalStartTimeProgress) {
            const local = timeProgress / motion.terminalStartTimeProgress;

            const acceleratedCruise =
                motion.cruiseLinearWeight * local + (1 - motion.cruiseLinearWeight) * local * local * local;

            return motion.terminalStartPathProgress * acceleratedCruise;
        }

        const local = (timeProgress - motion.terminalStartTimeProgress) / (1 - motion.terminalStartTimeProgress);

        const terminalRush =
            motion.terminalLinearWeight * local + (1 - motion.terminalLinearWeight) * local * local * local;

        return Phaser.Math.Linear(motion.terminalStartPathProgress, 1, terminalRush);
    }

    private createTrajectoryPoints(startPosition: Phaser.Math.Vector2): BridgeIncomingMissilePoint[] {
        const presentation = BRIDGE_INCOMING_MISSILE_PRESENTATION;

        const preset = presentation.trajectories[Phaser.Math.Between(0, presentation.trajectories.length - 1)];

        const points: BridgeIncomingMissilePoint[] = [
            {
                x: startPosition.x,
                y: startPosition.y,
            },
        ];

        for (let index = 0; index < preset.points.length; index += 1) {
            const point = preset.points[index];

            const jitterPx = index === 0 ? presentation.jitter.firstWaypointPx : presentation.jitter.waypointPx;

            points.push(this.createJitteredPoint(point, jitterPx));
        }

        points.push(this.createJitteredPoint(preset.end, presentation.jitter.endPx));

        return points;
    }

    private createJitteredPoint(point: BridgeIncomingMissilePoint, jitterPx: number): BridgeIncomingMissilePoint {
        return {
            x: point.x + Phaser.Math.Between(-jitterPx, jitterPx),

            y: point.y + Phaser.Math.Between(-jitterPx, jitterPx),
        };
    }

    private pushTrailPoint(point: BridgeIncomingMissilePoint): void {
        const trailConfig = BRIDGE_INCOMING_MISSILE_PRESENTATION.trail;

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

        while (this.trailPoints.length > trailConfig.maxParticleCount) {
            this.trailPoints.shift();
        }
    }

    private render(
        missilePoint: BridgeIncomingMissilePoint,

        pathProgress: number,
    ): void {
        const graphics = this.graphics;

        const presentation = BRIDGE_INCOMING_MISSILE_PRESENTATION;

        const trailConfig = presentation.trail;

        const missileConfig = presentation.missile;

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

            const roundedSize = Math.max(1, Math.round(particleSize));

            graphics.fillStyle(color, alpha);

            graphics.fillRect(
                Math.round(point.x - particleSize / 2),
                Math.round(point.y - particleSize / 2),
                roundedSize,
                roundedSize,
            );
        }

        const missileSize = Math.max(
            1,
            Math.round(Phaser.Math.Linear(missileConfig.minPixelSize, missileConfig.maxPixelSize, depth)),
        );

        const hotSize = missileSize + missileConfig.hotPaddingPx;

        graphics.fillStyle(missileConfig.hotColor, missileConfig.hotAlpha);

        graphics.fillRect(
            Math.round(missilePoint.x - hotSize / 2),
            Math.round(missilePoint.y - hotSize / 2),
            hotSize,
            hotSize,
        );

        graphics.fillStyle(missileConfig.coreColor, 1);

        graphics.fillRect(
            Math.round(missilePoint.x - missileSize / 2),
            Math.round(missilePoint.y - missileSize / 2),
            missileSize,
            missileSize,
        );
    }

    private getTrajectoryPoint(progress: number): BridgeIncomingMissilePoint {
        const points = this.trajectoryPoints;

        const segmentCount = points.length - 1;

        const scaledProgress = Phaser.Math.Clamp(progress, 0, 1) * segmentCount;

        const segmentIndex = Math.min(segmentCount - 1, Math.floor(scaledProgress));

        const localProgress = scaledProgress - segmentIndex;

        const point0 = points[Math.max(0, segmentIndex - 1)];

        const point1 = points[segmentIndex];

        const point2 = points[Math.min(points.length - 1, segmentIndex + 1)];

        const point3 = points[Math.min(points.length - 1, segmentIndex + 2)];

        return {
            x: this.catmullRom(point0.x, point1.x, point2.x, point3.x, localProgress),

            y: this.catmullRom(point0.y, point1.y, point2.y, point3.y, localProgress),
        };
    }

    private catmullRom(point0: number, point1: number, point2: number, point3: number, progress: number): number {
        const progressSquared = progress * progress;

        const progressCubed = progressSquared * progress;

        return (
            0.5 *
            (2 * point1 +
                (-point0 + point2) * progress +
                (2 * point0 - 5 * point1 + 4 * point2 - point3) * progressSquared +
                (-point0 + 3 * point1 - 3 * point2 + point3) * progressCubed)
        );
    }
}
