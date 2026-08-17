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
    private readonly scene:
        BridgeScene;

    private readonly graphics:
        Phaser.GameObjects.Graphics;

    private readonly initialTimeToImpactMs:
        number;

    private readonly trajectoryPoints:
        BridgeOutgoingMissilePoint[];

    private readonly missDirection:
        BridgeOutgoingMissilePoint;

    private missFadeElapsedMs =
        0;

    private missFadeOnComplete?:
        () => void;

    private readonly trailPoints:
        BridgeOutgoingMissileTrailPoint[] = [];

    private readonly previousPosition =
        new Phaser.Math.Vector2();

    private readonly currentPosition =
        new Phaser.Math.Vector2();

    private readonly missPreviousPosition =
        new Phaser.Math.Vector2();

    private readonly missStartPosition =
        new Phaser.Math.Vector2();

    private readonly missFadePoint =
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

        this.scene =
            scene;

        this.initialTimeToImpactMs =
            initialTimeToImpactMs;

        const trajectory =
            this.createTrajectory(
                startPosition,
                targetPosition,
            );

        this.trajectoryPoints =
            trajectory.points;

        this.missDirection =
            trajectory.missDirection;

        this.previousPosition.copy(
            startPosition,
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

        this.previousPosition.copy(
            this.currentPosition,
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

    public startMissFade(
        targetVisualBounds:
            Phaser.Geom.Rectangle,

        onComplete:
            () => void,
    ): void {
        if (
            this.missFadeOnComplete
        ) {
            throw new Error(
                'Outgoing missile miss fade already active',
            );
        }

        // Do not snap to the authoritative target point.
        // The MISS presentation continues from the exact last rendered sample.
        this.missPreviousPosition.copy(
            this.previousPosition,
        );

        this.missStartPosition.copy(
            this.currentPosition,
        );

        this.missFadePoint.copy(
            this.createMissFadePoint(
                targetVisualBounds,
            ),
        );

        this.missFadeElapsedMs =
            0;

        this.missFadeOnComplete =
            onComplete;

        this.scene.events.on(
            Phaser.Scenes.Events.UPDATE,
            this.handleMissFadeUpdate,
            this,
        );
    }

    public destroy(): void {
        this.stopMissFade();

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

    private createTrajectory(
        startPosition:
            Phaser.Math.Vector2,

        targetPosition:
            Phaser.Math.Vector2,
    ): {
        points:
            BridgeOutgoingMissilePoint[];

        missDirection:
            BridgeOutgoingMissilePoint;
    } {
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

        return {
            points,

            missDirection: {
                x:
                    preset
                        .missDirection
                        .x,

                y:
                    preset
                        .missDirection
                        .y,
            },
        };
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

    private createMissFadePoint(
        targetVisualBounds:
            Phaser.Geom.Rectangle,
    ): Phaser.Math.Vector2 {
        const config =
            BRIDGE_OUTGOING_MISSILE_PRESENTATION
                .miss;

        const direction =
            new Phaser.Math.Vector2(
                this.missDirection.x,
                this.missDirection.y,
            );

        if (
            direction.lengthSq() <=
            Number.EPSILON
        ) {
            throw new Error(
                'Outgoing missile miss direction must be non-zero',
            );
        }

        direction.normalize();

        const halfWidth =
            targetVisualBounds.width /
                2 +
            config.clearancePx;

        const halfHeight =
            targetVisualBounds.height /
                2 +
            config.clearancePx;

        const distanceToVerticalEdge =
            Math.abs(
                direction.x,
            ) >
            Number.EPSILON
                ? halfWidth /
                    Math.abs(
                        direction.x,
                    )
                : Number.POSITIVE_INFINITY;

        const distanceToHorizontalEdge =
            Math.abs(
                direction.y,
            ) >
            Number.EPSILON
                ? halfHeight /
                    Math.abs(
                        direction.y,
                    )
                : Number.POSITIVE_INFINITY;

        const expandedEdgeDistance =
            Math.min(
                distanceToVerticalEdge,
                distanceToHorizontalEdge,
            );

        const currentFromCenter =
            new Phaser.Math.Vector2(
                this.currentPosition.x -
                    targetVisualBounds
                        .centerX,

                this.currentPosition.y -
                    targetVisualBounds
                        .centerY,
            );

        const currentProjection =
            currentFromCenter.dot(
                direction,
            );

        const fadeDistance =
            Math.max(
                expandedEdgeDistance,
                currentProjection +
                    config
                        .minimumContinuationPx,
            );

        return new Phaser.Math.Vector2(
            targetVisualBounds.centerX +
                direction.x *
                    fadeDistance,

            targetVisualBounds.centerY +
                direction.y *
                    fadeDistance,
        );
    }

    private handleMissFadeUpdate(
        _time: number,
        deltaMs: number,
    ): void {
        const onComplete =
            this.missFadeOnComplete;

        if (!onComplete) {
            return;
        }

        this.missFadeElapsedMs +=
            Math.max(
                0,
                deltaMs,
            );

        const progress =
            Phaser.Math.Clamp(
                this.missFadeElapsedMs /
                    BRIDGE_OUTGOING_MISSILE_PRESENTATION
                        .miss
                        .fadeDurationMs,
                0,
                1,
            );

        // A virtual fourth control point continues past the visible fade point.
        // The missile therefore keeps a real outgoing tangent instead of
        // visibly stopping or kinking at the point where it disappears.
        const continuationX =
            this.missFadePoint.x +
            (
                this.missFadePoint.x -
                this.missStartPosition.x
            );

        const continuationY =
            this.missFadePoint.y +
            (
                this.missFadePoint.y -
                this.missStartPosition.y
            );

        const point:
            BridgeOutgoingMissilePoint = {
                x:
                    this.catmullRom(
                        this.missPreviousPosition.x,
                        this.missStartPosition.x,
                        this.missFadePoint.x,
                        continuationX,
                        progress,
                    ),

                y:
                    this.catmullRom(
                        this.missPreviousPosition.y,
                        this.missStartPosition.y,
                        this.missFadePoint.y,
                        continuationY,
                        progress,
                    ),
            };

        this.currentPosition.set(
            point.x,
            point.y,
        );

        this.pushTrailPoint(
            point,
            1,
        );

        this.render(
            point,
            1,
            1 - progress,
        );

        if (
            progress <
            1
        ) {
            return;
        }

        this.stopMissFade();
        onComplete();
    }

    private stopMissFade(): void {
        this.scene.events.off(
            Phaser.Scenes.Events.UPDATE,
            this.handleMissFadeUpdate,
            this,
        );

        this.missFadeElapsedMs =
            0;

        this.missFadeOnComplete =
            undefined;
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

        fadeScale = 1,
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

        if (
            fadeScale <=
            0
        ) {
            return;
        }

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
                ) *
                fadeScale;

            const alpha =
                Phaser.Math.Linear(
                    trailConfig.targetAlpha,
                    trailConfig.startAlpha,
                    visualWeight,
                ) *
                fadeScale;

            const color =
                ageProgress > 0.66
                    ? trailConfig.hotColor
                    : trailConfig.coolColor;

            const roundedSize =
                Math.max(
                    0,
                    Math.round(
                        particleSize,
                    ),
                );

            if (
                roundedSize <=
                0
            ) {
                continue;
            }

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
                0,
                Math.round(
                    Phaser.Math.Linear(
                        missileConfig
                            .targetPixelSize,
                        missileConfig
                            .startPixelSize,
                        reverseDepth,
                    ) *
                        fadeScale,
                ),
            );

        if (
            missileSize <=
            0
        ) {
            return;
        }

        const hotSize =
            Math.max(
                missileSize,
                Math.round(
                    (
                        missileSize +
                        missileConfig
                            .hotPaddingPx
                    ) *
                        fadeScale,
                ),
            );

        graphics.fillStyle(
            missileConfig.hotColor,
            missileConfig.hotAlpha *
                fadeScale,
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
            fadeScale,
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
