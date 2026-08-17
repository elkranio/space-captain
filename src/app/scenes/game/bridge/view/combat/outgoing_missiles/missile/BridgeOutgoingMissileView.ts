// src/app/scenes/game/bridge/view/combat/outgoing_missiles/missile/BridgeOutgoingMissileView.ts

import type BridgeScene from '../../../../BridgeScene';
import {
    BRIDGE_OUTGOING_MISSILE_PRESENTATION,
    type BridgeOutgoingMissilePoint,
    type BridgeOutgoingMissileTrailPoint,
    type BridgeOutgoingMissileWaypoint,
} from './bridge_outgoing_missile_presentation';

type BridgeOutgoingMissileMissCurveSample = {
    point:
        BridgeOutgoingMissilePoint;

    distancePx: number;
};

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

    private previousTimeToImpactMs?:
        number;

    private lastFlightSpeedPxPerMs =
        0;

    private missFlightSpeedPxPerMs =
        0;

    private missTravelledDistancePx =
        0;

    private missCurveLengthPx =
        0;

    private missExitDistancePx =
        0;

    private readonly missCurveSamples:
        BridgeOutgoingMissileMissCurveSample[] = [];

    private missPassByOnComplete?:
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

    private readonly missGuidePoint =
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

        const previousTimeToImpactMs =
            this.previousTimeToImpactMs;

        this.previousPosition.copy(
            this.currentPosition,
        );

        this.currentPosition.set(
            point.x,
            point.y,
        );

        if (
            previousTimeToImpactMs !==
            undefined
        ) {
            const flightDeltaMs =
                previousTimeToImpactMs -
                timeToImpactMs;

            const flightDistancePx =
                Phaser.Math.Distance.Between(
                    this.previousPosition.x,
                    this.previousPosition.y,
                    this.currentPosition.x,
                    this.currentPosition.y,
                );

            if (
                flightDeltaMs >
                    0 &&
                flightDistancePx >
                    Number.EPSILON
            ) {
                this.lastFlightSpeedPxPerMs =
                    flightDistancePx /
                    flightDeltaMs;
            }
        }

        this.previousTimeToImpactMs =
            timeToImpactMs;

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

    public startMissPassBy(
        targetVisualBounds:
            Phaser.Geom.Rectangle,

        onComplete:
            () => void,
    ): void {
        if (
            this.missPassByOnComplete
        ) {
            throw new Error(
                'Outgoing missile MISS pass-by already active',
            );
        }

        // The engine has already resolved MISS and removed the projectile.
        // Presentation continues from the exact last rendered sample.
        this.missPreviousPosition.copy(
            this.previousPosition,
        );

        this.missStartPosition.copy(
            this.currentPosition,
        );

        this.missGuidePoint.copy(
            this.createMissGuidePoint(
                targetVisualBounds,
            ),
        );

        this.missFlightSpeedPxPerMs =
            this.getMissFlightSpeedPxPerMs();

        this.buildMissCurveSamples(
            targetVisualBounds,
        );

        this.missTravelledDistancePx =
            0;

        this.missPassByOnComplete =
            onComplete;

        this.scene.events.on(
            Phaser.Scenes.Events.UPDATE,
            this.handleMissPassByUpdate,
            this,
        );
    }

    public destroy(): void {
        this.stopMissPassBy();

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

    private createMissGuidePoint(
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

        const guideDistance =
            Math.max(
                expandedEdgeDistance,
                currentProjection,
            ) +
            config
                .guidePastClearancePx;

        return new Phaser.Math.Vector2(
            targetVisualBounds.centerX +
                direction.x *
                    guideDistance,

            targetVisualBounds.centerY +
                direction.y *
                    guideDistance,
        );
    }

    private getMissFlightSpeedPxPerMs():
        number {
        if (
            this.lastFlightSpeedPxPerMs >
            Number.EPSILON
        ) {
            return this.lastFlightSpeedPxPerMs;
        }

        // Runtime normally has several authoritative samples before impact.
        // Keep a deterministic fallback for coarse-step/debug cases where
        // presentation only saw the launch state before the MISS event.
        const sampleStartProgress =
            0.95;

        const sampleStart =
            this.getTrajectoryPoint(
                sampleStartProgress,
            );

        const sampleEnd =
            this.getTrajectoryPoint(
                1,
            );

        const sampleDistancePx =
            Phaser.Math.Distance.Between(
                sampleStart.x,
                sampleStart.y,
                sampleEnd.x,
                sampleEnd.y,
            );

        const sampleDurationMs =
            this.initialTimeToImpactMs *
            (
                1 -
                sampleStartProgress
            );

        const fallbackSpeedPxPerMs =
            sampleDistancePx /
            sampleDurationMs;

        if (
            fallbackSpeedPxPerMs <=
            Number.EPSILON
        ) {
            throw new Error(
                'Outgoing missile MISS could not resolve terminal screen speed',
            );
        }

        return fallbackSpeedPxPerMs;
    }

    private buildMissCurveSamples(
        targetVisualBounds:
            Phaser.Geom.Rectangle,
    ): void {
        const config =
            BRIDGE_OUTGOING_MISSILE_PRESENTATION
                .miss;

        const continuationPoint = {
            x:
                this.missGuidePoint.x +
                (
                    this.missGuidePoint.x -
                    this.missStartPosition.x
                ),

            y:
                this.missGuidePoint.y +
                (
                    this.missGuidePoint.y -
                    this.missStartPosition.y
                ),
        };

        this.missCurveSamples.length =
            0;

        this.missCurveLengthPx =
            0;

        let previousPoint: BridgeOutgoingMissilePoint = {
            x:
                this.missStartPosition.x,

            y:
                this.missStartPosition.y,
        };

        this.missCurveSamples.push({
            point:
                previousPoint,

            distancePx:
                0,
        });

        for (
            let index = 1;
            index <=
                config
                    .curveSampleCount;
            index += 1
        ) {
            const progress =
                index /
                config
                    .curveSampleCount;

            const point:
                BridgeOutgoingMissilePoint = {
                    x:
                        this.catmullRom(
                            this.missPreviousPosition.x,
                            this.missStartPosition.x,
                            this.missGuidePoint.x,
                            continuationPoint.x,
                            progress,
                        ),

                    y:
                        this.catmullRom(
                            this.missPreviousPosition.y,
                            this.missStartPosition.y,
                            this.missGuidePoint.y,
                            continuationPoint.y,
                            progress,
                        ),
                };

            this.missCurveLengthPx +=
                Phaser.Math.Distance.Between(
                    previousPoint.x,
                    previousPoint.y,
                    point.x,
                    point.y,
                );

            this.missCurveSamples.push({
                point,

                distancePx:
                    this.missCurveLengthPx,
            });

            previousPoint =
                point;
        }

        if (
            this.missCurveLengthPx <=
            Number.EPSILON
        ) {
            throw new Error(
                'Outgoing missile MISS curve has no length',
            );
        }

        this.missExitDistancePx =
            this.findMissExitDistancePx(
                targetVisualBounds,
            );
    }

    private findMissExitDistancePx(
        targetVisualBounds:
            Phaser.Geom.Rectangle,
    ): number {
        const clearancePx =
            BRIDGE_OUTGOING_MISSILE_PRESENTATION
                .miss
                .clearancePx;

        const left =
            targetVisualBounds.left -
            clearancePx;

        const right =
            targetVisualBounds.right +
            clearancePx;

        const top =
            targetVisualBounds.top -
            clearancePx;

        const bottom =
            targetVisualBounds.bottom +
            clearancePx;

        const isInsideExpandedBounds = (
            point:
                BridgeOutgoingMissilePoint,
        ): boolean => {
            return (
                point.x >=
                    left &&
                point.x <=
                    right &&
                point.y >=
                    top &&
                point.y <=
                    bottom
            );
        };

        const firstSample =
            this.missCurveSamples[0];

        if (!firstSample) {
            throw new Error(
                'Outgoing missile MISS curve has no first sample',
            );
        }

        // If the authoritative MISS presentation already starts fully clear
        // of the ship silhouette, pass-by can resolve immediately.
        if (
            !isInsideExpandedBounds(
                firstSample.point,
            )
        ) {
            return 0;
        }

        for (
            let index = 1;
            index <
                this.missCurveSamples
                    .length;
            index += 1
        ) {
            const previousSample =
                this.missCurveSamples[
                    index - 1
                ];

            const currentSample =
                this.missCurveSamples[
                    index
                ];

            if (
                isInsideExpandedBounds(
                    currentSample.point,
                )
            ) {
                continue;
            }

            // Movement itself interpolates between these same arc-length
            // samples, so a short binary search gives the matching visual exit
            // point instead of approximating from authored direction alone.
            let insideDistancePx =
                previousSample.distancePx;

            let outsideDistancePx =
                currentSample.distancePx;

            for (
                let iteration = 0;
                iteration < 8;
                iteration += 1
            ) {
                const middleDistancePx =
                    (
                        insideDistancePx +
                        outsideDistancePx
                    ) /
                    2;

                const segmentLengthPx =
                    currentSample
                        .distancePx -
                    previousSample
                        .distancePx;

                const segmentProgress =
                    segmentLengthPx >
                    Number.EPSILON
                        ? (
                              middleDistancePx -
                              previousSample
                                  .distancePx
                          ) /
                          segmentLengthPx
                        : 0;

                const middlePoint:
                    BridgeOutgoingMissilePoint = {
                        x:
                            Phaser.Math.Linear(
                                previousSample
                                    .point
                                    .x,
                                currentSample
                                    .point
                                    .x,
                                segmentProgress,
                            ),

                        y:
                            Phaser.Math.Linear(
                                previousSample
                                    .point
                                    .y,
                                currentSample
                                    .point
                                    .y,
                                segmentProgress,
                            ),
                    };

                if (
                    isInsideExpandedBounds(
                        middlePoint,
                    )
                ) {
                    insideDistancePx =
                        middleDistancePx;
                } else {
                    outsideDistancePx =
                        middleDistancePx;
                }
            }

            return outsideDistancePx;
        }

        // createMissGuidePoint() guarantees an endpoint beyond the expanded
        // bounds, so reaching this branch would mean the sampled path violated
        // that presentation invariant.
        throw new Error(
            'Outgoing missile MISS curve never clears target visual bounds',
        );
    }

    private getMissCurvePointAtDistance(
        distancePx: number,
    ): BridgeOutgoingMissilePoint {
        const clampedDistancePx =
            Phaser.Math.Clamp(
                distancePx,
                0,
                this.missCurveLengthPx,
            );

        for (
            let index = 1;
            index <
                this.missCurveSamples
                    .length;
            index += 1
        ) {
            const currentSample =
                this.missCurveSamples[
                    index
                ];

            const previousSample =
                this.missCurveSamples[
                    index - 1
                ];

            if (
                clampedDistancePx >
                currentSample
                    .distancePx
            ) {
                continue;
            }

            const segmentLengthPx =
                currentSample
                    .distancePx -
                previousSample
                    .distancePx;

            const segmentProgress =
                segmentLengthPx >
                Number.EPSILON
                    ? (
                          clampedDistancePx -
                          previousSample
                              .distancePx
                      ) /
                      segmentLengthPx
                    : 0;

            return {
                x:
                    Phaser.Math.Linear(
                        previousSample
                            .point
                            .x,
                        currentSample
                            .point
                            .x,
                        segmentProgress,
                    ),

                y:
                    Phaser.Math.Linear(
                        previousSample
                            .point
                            .y,
                        currentSample
                            .point
                            .y,
                        segmentProgress,
                    ),
            };
        }

        const lastSample =
            this.missCurveSamples[
                this.missCurveSamples
                    .length - 1
            ];

        if (!lastSample) {
            throw new Error(
                'Outgoing missile MISS curve has no samples',
            );
        }

        return {
            x:
                lastSample.point.x,

            y:
                lastSample.point.y,
        };
    }

    private handleMissPassByUpdate(
        _time: number,
        deltaMs: number,
    ): void {
        const onComplete =
            this.missPassByOnComplete;

        if (!onComplete) {
            return;
        }

        if (
            this.missExitDistancePx <=
            Number.EPSILON
        ) {
            this.stopMissPassBy();
            onComplete();

            return;
        }

        const missConfig =
            BRIDGE_OUTGOING_MISSILE_PRESENTATION
                .miss;

        const previousProgress =
            Phaser.Math.Clamp(
                this.missTravelledDistancePx /
                    this.missExitDistancePx,
                0,
                1,
            );

        // Accelerate hardest immediately after the MISS, then taper toward
        // the configured maximum. Starts at exactly 1.00x, so there is no
        // discontinuous speed jump at the authoritative resolution point.
        const accelerationProgress =
            1 -
            (
                1 -
                previousProgress
            ) *
                (
                    1 -
                    previousProgress
                );

        const speedMultiplier =
            Phaser.Math.Linear(
                1,
                missConfig
                    .passByMaxSpeedMultiplier,
                accelerationProgress,
            );

        const frameDistancePx =
            this.missFlightSpeedPxPerMs *
            speedMultiplier *
            Math.max(
                0,
                deltaMs,
            );

        this.missTravelledDistancePx =
            Math.min(
                this.missExitDistancePx,
                this.missTravelledDistancePx +
                    frameDistancePx,
            );

        const passByProgress =
            Phaser.Math.Clamp(
                this.missTravelledDistancePx /
                    this.missExitDistancePx,
                0,
                1,
            );

        const point =
            this.getMissCurvePointAtDistance(
                this.missTravelledDistancePx,
            );

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
            Phaser.Math.Linear(
                1,
                missConfig
                    .passByMaxSizeMultiplier,
                passByProgress,
            ),
        );

        if (
            this.missTravelledDistancePx <
            this.missExitDistancePx
        ) {
            return;
        }

        this.stopMissPassBy();
        onComplete();
    }

    private stopMissPassBy(): void {
        this.scene.events.off(
            Phaser.Scenes.Events.UPDATE,
            this.handleMissPassByUpdate,
            this,
        );

        this.missFlightSpeedPxPerMs =
            0;

        this.missTravelledDistancePx =
            0;

        this.missCurveLengthPx =
            0;

        this.missExitDistancePx =
            0;

        this.missCurveSamples.length =
            0;

        this.missPassByOnComplete =
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

        sizeScale = 1,
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
                ) *
                sizeScale;

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

        const baseMissileSize =
            Phaser.Math.Linear(
                missileConfig
                    .targetPixelSize,
                missileConfig
                    .startPixelSize,
                reverseDepth,
            );

        const missileSize =
            Math.max(
                1,
                Math.round(
                    baseMissileSize *
                        sizeScale,
                ),
            );

        const hotSize =
            Math.max(
                missileSize,
                Math.round(
                    (
                        baseMissileSize +
                        missileConfig
                            .hotPaddingPx
                    ) *
                        sizeScale,
                ),
            );

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
