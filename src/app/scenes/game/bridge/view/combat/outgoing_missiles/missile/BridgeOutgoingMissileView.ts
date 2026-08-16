// src/app/scenes/game/bridge/view/combat/outgoing_missiles/missile/BridgeOutgoingMissileView.ts

import type BridgeScene from '../../../../BridgeScene';
import {
    BRIDGE_OUTGOING_MISSILE_PRESENTATION,
    type BridgeOutgoingMissilePoint,
    type BridgeOutgoingMissileTrailPoint,
    type BridgeOutgoingMissileWaypoint,
} from './bridge_outgoing_missile_presentation';

type BridgeOutgoingMissileViewOptions = {
    scene: BridgeScene;

    parent:
        Phaser.GameObjects.Container;

    projectileId: string;

    startPosition:
        Phaser.Math.Vector2;

    targetPosition:
        Phaser.Math.Vector2;

    initialTimeToImpactMs: number;
};

// One player missile in flight.
//
// Engine owns time.
// The view chooses one visual trajectory and its
// small immutable waypoint jitter at creation.
//
// Exhaust is represented by spatial trail samples.
// Because samples are previous missile positions,
// the exhaust naturally stays behind the missile
// through every turn without a separate facing model.
export default class BridgeOutgoingMissileView {
    private readonly graphics:
        Phaser.GameObjects.Graphics;

    private readonly initialTimeToImpactMs:
        number;

    private readonly trajectoryPoints:
        BridgeOutgoingMissilePoint[];

    private readonly trailPoints:
        BridgeOutgoingMissileTrailPoint[] = [];

    private readonly currentPosition =
        new Phaser.Math.Vector2();

    constructor({
        scene,
        parent,

        projectileId,

        startPosition,
        targetPosition,

        initialTimeToImpactMs,
    }: BridgeOutgoingMissileViewOptions) {
        if (initialTimeToImpactMs <= 0) {
            throw new Error(
                'Outgoing missile initial time must be positive: ' +
                    projectileId,
            );
        }

        this.initialTimeToImpactMs =
            initialTimeToImpactMs;

        this.trajectoryPoints =
            this.createTrajectoryPoints(
                startPosition,
                targetPosition,
            );

        this.currentPosition.copy(
            startPosition,
        );

        this.graphics =
            scene.add.graphics();

        parent.add(this.graphics);

        this.update(
            initialTimeToImpactMs,
        );
    }

    public update(
        timeToImpactMs: number,
    ): void {
        const pathProgress =
            this.getTimeProgress(
                timeToImpactMs,
            );

        const point =
            this.getTrajectoryPoint(
                pathProgress,
            );

        this.currentPosition.set(
            point.x,
            point.y,
        );

        this.pushTrailPoint(
            point,
            pathProgress,
        );

        this.render(
            point,
            pathProgress,
        );
    }

    public getPosition():
        Phaser.Math.Vector2 {
        return this.currentPosition.clone();
    }

    public destroy(): void {
        this.trailPoints.length = 0;
        this.graphics.destroy();
    }

    private getTimeProgress(
        timeToImpactMs: number,
    ): number {
        const clampedRemainingMs =
            Phaser.Math.Clamp(
                timeToImpactMs,
                0,
                this.initialTimeToImpactMs,
            );

        return (
            1 -
            clampedRemainingMs /
                this.initialTimeToImpactMs
        );
    }

    private createTrajectoryPoints(
        startPosition:
            Phaser.Math.Vector2,

        targetPosition:
            Phaser.Math.Vector2,
    ): BridgeOutgoingMissilePoint[] {
        const presentation =
            BRIDGE_OUTGOING_MISSILE_PRESENTATION;

        const preset =
            presentation.trajectories[
                Phaser.Math.Between(
                    0,
                    presentation
                        .trajectories
                        .length - 1,
                )
            ];

        const points:
            BridgeOutgoingMissilePoint[] = [
                {
                    x: startPosition.x,
                    y: startPosition.y,
                },
            ];

        for (
            const waypoint
            of preset.waypoints
        ) {
            points.push(
                this.createWaypointPoint(
                    startPosition,
                    targetPosition,
                    waypoint,
                ),
            );
        }

        points.push({
            x: targetPosition.x,
            y: targetPosition.y,
        });

        return points;
    }

    private createWaypointPoint(
        startPosition:
            Phaser.Math.Vector2,

        targetPosition:
            Phaser.Math.Vector2,

        waypoint:
            BridgeOutgoingMissileWaypoint,
    ): BridgeOutgoingMissilePoint {
        const jitter =
            BRIDGE_OUTGOING_MISSILE_PRESENTATION
                .jitter
                .waypointPx;

        return {
            x:
                Phaser.Math.Linear(
                    startPosition.x,
                    targetPosition.x,
                    waypoint.progress,
                ) +
                waypoint.offsetX +
                Phaser.Math.Between(
                    -jitter,
                    jitter,
                ),

            y:
                Phaser.Math.Linear(
                    startPosition.y,
                    targetPosition.y,
                    waypoint.progress,
                ) +
                waypoint.offsetY +
                Phaser.Math.Between(
                    -jitter,
                    jitter,
                ),
        };
    }

    private pushTrailPoint(
        point: BridgeOutgoingMissilePoint,
        pathProgress: number,
    ): void {
        const trailConfig =
            BRIDGE_OUTGOING_MISSILE_PRESENTATION
                .trail;

        const previousPoint =
            this.trailPoints[
                this.trailPoints.length - 1
            ];

        if (previousPoint) {
            const distance =
                Phaser.Math.Distance.Between(
                    previousPoint.x,
                    previousPoint.y,
                    point.x,
                    point.y,
                );

            if (
                distance <
                trailConfig
                    .minParticleSpacingPx
            ) {
                return;
            }
        }

        this.trailPoints.push({
            x: point.x,
            y: point.y,
            pathProgress,
        });

        while (
            this.trailPoints.length >
            trailConfig.startParticleCount
        ) {
            this.trailPoints.shift();
        }
    }

    private render(
        missilePoint:
            BridgeOutgoingMissilePoint,

        pathProgress: number,
    ): void {
        const graphics =
            this.graphics;

        const presentation =
            BRIDGE_OUTGOING_MISSILE_PRESENTATION;

        const missileConfig =
            presentation.missile;

        const trailConfig =
            presentation.trail;

        graphics.clear();

        const reverseDepth =
            this.getReverseDepth(
                pathProgress,
            );

        const particleCount =
            Math.round(
                Phaser.Math.Linear(
                    trailConfig
                        .targetParticleCount,
                    trailConfig
                        .startParticleCount,
                    reverseDepth,
                ),
            );

        const visibleStartIndex =
            Math.max(
                0,
                this.trailPoints.length -
                    particleCount,
            );

        const visiblePoints =
            this.trailPoints.slice(
                visibleStartIndex,
            );

        for (
            let index = 0;
            index < visiblePoints.length;
            index += 1
        ) {
            const point =
                visiblePoints[index];

            const ageProgress =
                visiblePoints.length <= 1
                    ? 1
                    : index /
                        (
                            visiblePoints.length -
                            1
                        );

            const pointDepth =
                this.getReverseDepth(
                    point.pathProgress,
                );

            const visualWeight =
                pointDepth *
                ageProgress;

            const particleSize =
                Phaser.Math.Linear(
                    trailConfig
                        .targetParticleSize,
                    trailConfig
                        .startParticleSize,
                    visualWeight,
                );

            const alpha =
                Phaser.Math.Linear(
                    trailConfig.targetAlpha,
                    trailConfig.startAlpha,
                    visualWeight,
                );

            const color =
                ageProgress > 0.66
                    ? trailConfig.hotColor
                    : trailConfig.coolColor;

            const roundedSize =
                Math.max(
                    1,
                    Math.round(
                        particleSize,
                    ),
                );

            graphics.fillStyle(
                color,
                alpha,
            );

            graphics.fillRect(
                Math.round(
                    point.x -
                        particleSize / 2,
                ),
                Math.round(
                    point.y -
                        particleSize / 2,
                ),
                roundedSize,
                roundedSize,
            );
        }

        const missileSize =
            Math.max(
                1,
                Math.round(
                    Phaser.Math.Linear(
                        missileConfig
                            .targetPixelSize,
                        missileConfig
                            .startPixelSize,
                        reverseDepth,
                    ),
                ),
            );

        const hotSize =
            missileSize +
            missileConfig.hotPaddingPx;

        graphics.fillStyle(
            missileConfig.hotColor,
            missileConfig.hotAlpha,
        );

        graphics.fillRect(
            Math.round(
                missilePoint.x -
                    hotSize / 2,
            ),
            Math.round(
                missilePoint.y -
                    hotSize / 2,
            ),
            hotSize,
            hotSize,
        );

        graphics.fillStyle(
            missileConfig.coreColor,
            1,
        );

        graphics.fillRect(
            Math.round(
                missilePoint.x -
                    missileSize / 2,
            ),
            Math.round(
                missilePoint.y -
                    missileSize / 2,
            ),
            missileSize,
            missileSize,
        );
    }

    private getReverseDepth(
        pathProgress: number,
    ): number {
        return (
            1 -
            Math.sqrt(
                Phaser.Math.Clamp(
                    pathProgress,
                    0,
                    1,
                ),
            )
        );
    }

    private getTrajectoryPoint(
        progress: number,
    ): BridgeOutgoingMissilePoint {
        const points =
            this.trajectoryPoints;

        const segmentCount =
            points.length - 1;

        const scaledProgress =
            Phaser.Math.Clamp(
                progress,
                0,
                1,
            ) *
            segmentCount;

        const segmentIndex =
            Math.min(
                segmentCount - 1,
                Math.floor(
                    scaledProgress,
                ),
            );

        const localProgress =
            scaledProgress -
            segmentIndex;

        const point0 =
            points[
                Math.max(
                    0,
                    segmentIndex - 1,
                )
            ];

        const point1 =
            points[segmentIndex];

        const point2 =
            points[
                Math.min(
                    points.length - 1,
                    segmentIndex + 1,
                )
            ];

        const point3 =
            points[
                Math.min(
                    points.length - 1,
                    segmentIndex + 2,
                )
            ];

        return {
            x: this.catmullRom(
                point0.x,
                point1.x,
                point2.x,
                point3.x,
                localProgress,
            ),

            y: this.catmullRom(
                point0.y,
                point1.y,
                point2.y,
                point3.y,
                localProgress,
            ),
        };
    }

    private catmullRom(
        point0: number,
        point1: number,
        point2: number,
        point3: number,
        progress: number,
    ): number {
        const progressSquared =
            progress * progress;

        const progressCubed =
            progressSquared *
            progress;

        return (
            0.5 *
            (
                2 * point1 +
                (
                    -point0 +
                    point2
                ) *
                    progress +
                (
                    2 * point0 -
                    5 * point1 +
                    4 * point2 -
                    point3
                ) *
                    progressSquared +
                (
                    -point0 +
                    3 * point1 -
                    3 * point2 +
                    point3
                ) *
                    progressCubed
            )
        );
    }
}
