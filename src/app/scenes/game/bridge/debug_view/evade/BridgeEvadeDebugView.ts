// src/app/scenes/game/bridge/debug_view/evade/BridgeEvadeDebugView.ts

import type BridgeScene from '../../BridgeScene';
import {
    BRIDGE_VIEWSCREEN_RECT,
} from '../../view/bridge_viewscreen_layout';
import {
    BRIDGE_EVADE_DEBUG_CONFIG,
} from './bridge_evade_debug_config';

type DebugEvadePhase =
    | 'idle'
    | 'warmup'
    | 'evading'
    | 'returning';

type DebugEvadePose = {
    offsetX: number;
};

type TransformableWorldObject =
    Phaser.GameObjects.GameObject & {
        x: number;
    };

type RenderTransformSnapshot = {
    object:
        TransformableWorldObject;

    x: number;
};

type DustParticle = {
    x: number;
    y: number;

    bandIndex: number;

    lengthScale: number;
    alphaScale: number;
};

const WORLD_LAYER_KEYS = [
    'objects',
    'vfx',
] as const;

const DUST_MARGIN_X = 18;
const DUST_MARGIN_Y = 12;

// Disposable visual sandbox for player Evade.
//
// E:
// - from idle: WARMUP -> EVADING -> RETURN;
// - during WARMUP / EVADING: interrupt -> RETURN.
//
// V2 deliberately removes roll. The distant space background stays fixed,
// world objects make only a tiny lateral jink, and parallax dust sells the
// stronger apparent maneuver.
//
// World transforms remain render-only: POST_UPDATE offsets the top-level
// objects, PRE_UPDATE restores their exact nominal positions before normal
// bridge/gameplay presentation runs again.
export default class BridgeEvadeDebugView {
    private phase:
        DebugEvadePhase =
        'idle';

    private phaseElapsedMs = 0;

    private pose:
        DebugEvadePose = {
            offsetX: 0,
        };

    private previousPoseOffsetX = 0;

    private returnStartPose:
        DebugEvadePose = {
            offsetX: 0,
        };

    private returnStartDustAlpha = 0;

    private dustAlpha = 0;

    private dustMotionX = 0;

    private readonly dustGraphics:
        Phaser.GameObjects.Graphics;

    private readonly dustParticles:
        DustParticle[] = [];

    private readonly renderedSnapshots:
        RenderTransformSnapshot[] =
        [];

    constructor(
        private readonly scene:
            BridgeScene,
    ) {
        this.dustGraphics =
            this.scene.add.graphics();

        this.scene.layers
            .get('vfx')
            .add(
                this.dustGraphics,
            );

        this.createDustParticles();

        this.scene.input.keyboard?.on(
            'keydown-E',
            this.handleEvadeKeyDown,
            this,
        );

        this.scene.events.on(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );

        this.scene.events.on(
            Phaser.Scenes.Events.POST_UPDATE,
            this.handlePostUpdate,
            this,
        );

        this.scene.events.on(
            Phaser.Scenes.Events.PRE_UPDATE,
            this.handlePreUpdate,
            this,
        );
    }

    public destroy(): void {
        this.restoreRenderedWorld();

        this.scene.input.keyboard?.off(
            'keydown-E',
            this.handleEvadeKeyDown,
            this,
        );

        this.scene.events.off(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );

        this.scene.events.off(
            Phaser.Scenes.Events.POST_UPDATE,
            this.handlePostUpdate,
            this,
        );

        this.scene.events.off(
            Phaser.Scenes.Events.PRE_UPDATE,
            this.handlePreUpdate,
            this,
        );

        this.dustGraphics.destroy();
    }

    private handleEvadeKeyDown(
        event: KeyboardEvent,
    ): void {
        if (event.repeat) {
            return;
        }

        if (
            this.phase ===
            'idle'
        ) {
            this.startCycle();
            return;
        }

        if (
            this.phase ===
            'returning'
        ) {
            return;
        }

        this.startReturn();
    }

    private handleSceneUpdate(
        _time: number,
        deltaMs: number,
    ): void {
        if (
            this.phase ===
            'idle'
        ) {
            this.clearDust();
            return;
        }

        const safeDeltaMs =
            Math.max(
                0,
                deltaMs,
            );

        this.previousPoseOffsetX =
            this.pose.offsetX;

        this.advanceMotion(
            safeDeltaMs,
        );

        this.updateDust(
            safeDeltaMs,
        );
    }

    private handlePreUpdate(): void {
        this.restoreRenderedWorld();
    }

    private handlePostUpdate(): void {
        this.applyRenderedWorldOffset();
    }

    private startCycle(): void {
        this.phase =
            'warmup';

        this.phaseElapsedMs =
            0;

        this.pose = {
            offsetX: 0,
        };

        this.previousPoseOffsetX =
            0;

        this.dustAlpha =
            0;

        this.dustMotionX =
            0;

        this.randomizeDustPositions();
    }

    private startReturn(): void {
        this.phase =
            'returning';

        this.phaseElapsedMs =
            0;

        this.returnStartPose = {
            ...this.pose,
        };

        this.returnStartDustAlpha =
            this.dustAlpha;
    }

    private advanceMotion(
        deltaMs: number,
    ): void {
        let remainingMs =
            deltaMs;

        while (
            remainingMs > 0 &&
            this.phase !==
                'idle'
        ) {
            const durationMs =
                this.getPhaseDurationMs();

            const phaseRemainingMs =
                Math.max(
                    0,
                    durationMs -
                        this.phaseElapsedMs,
                );

            const consumedMs =
                Math.min(
                    remainingMs,
                    phaseRemainingMs,
                );

            this.phaseElapsedMs +=
                consumedMs;

            remainingMs -=
                consumedMs;

            this.updatePoseForCurrentPhase();

            if (
                this.phaseElapsedMs <
                durationMs
            ) {
                break;
            }

            this.completeCurrentPhase();
        }
    }

    private getPhaseDurationMs():
        number {
        switch (this.phase) {
            case 'warmup':
                return BRIDGE_EVADE_DEBUG_CONFIG
                    .warmupDurationMs;

            case 'evading':
                return BRIDGE_EVADE_DEBUG_CONFIG
                    .evadeDurationMs;

            case 'returning':
                return BRIDGE_EVADE_DEBUG_CONFIG
                    .returnDurationMs;

            case 'idle':
                return 0;

            default: {
                const exhaustivePhase:
                    never =
                    this.phase;

                return exhaustivePhase;
            }
        }
    }

    private updatePoseForCurrentPhase():
        void {
        const durationMs =
            this.getPhaseDurationMs();

        const progress =
            durationMs <= 0
                ? 1
                : Phaser.Math.Clamp(
                      this.phaseElapsedMs /
                          durationMs,
                      0,
                      1,
                  );

        switch (this.phase) {
            case 'warmup': {
                const eased =
                    smoothStep(
                        progress,
                    );

                this.pose = {
                    offsetX:
                        Phaser.Math.Linear(
                            0,

                            BRIDGE_EVADE_DEBUG_CONFIG
                                .warmupOffsetX,

                            eased,
                        ),
                };

                this.dustAlpha =
                    Phaser.Math.Linear(
                        0,

                        BRIDGE_EVADE_DEBUG_CONFIG
                            .dust
                            .warmupAlpha,

                        eased,
                    );

                return;
            }

            case 'evading':
                this.pose =
                    getEvadePose(
                        progress,
                    );

                this.dustAlpha =
                    BRIDGE_EVADE_DEBUG_CONFIG
                        .dust
                        .evadeAlpha;

                return;

            case 'returning': {
                const eased =
                    easeOutCubic(
                        progress,
                    );

                this.pose = {
                    offsetX:
                        Phaser.Math.Linear(
                            this.returnStartPose
                                .offsetX,

                            0,
                            eased,
                        ),
                };

                this.dustAlpha =
                    Phaser.Math.Linear(
                        this.returnStartDustAlpha,
                        0,
                        eased,
                    );

                return;
            }

            case 'idle':
                return;

            default: {
                const exhaustivePhase:
                    never =
                    this.phase;

                return exhaustivePhase;
            }
        }
    }

    private completeCurrentPhase():
        void {
        switch (this.phase) {
            case 'warmup':
                this.phase =
                    'evading';

                this.phaseElapsedMs =
                    0;

                this.pose =
                    getEvadePose(
                        0,
                    );

                this.dustAlpha =
                    BRIDGE_EVADE_DEBUG_CONFIG
                        .dust
                        .evadeAlpha;

                return;

            case 'evading':
                this.startReturn();
                return;

            case 'returning':
                this.phase =
                    'idle';

                this.phaseElapsedMs =
                    0;

                this.pose = {
                    offsetX: 0,
                };

                this.previousPoseOffsetX =
                    0;

                this.dustAlpha =
                    0;

                this.dustMotionX =
                    0;

                this.clearDust();

                return;

            case 'idle':
                return;

            default: {
                const exhaustivePhase:
                    never =
                    this.phase;

                return exhaustivePhase;
            }
        }
    }

    private createDustParticles():
        void {
        const bands =
            BRIDGE_EVADE_DEBUG_CONFIG
                .dust
                .bands;

        bands.forEach(
            (
                band,
                bandIndex,
            ) => {
                for (
                    let index = 0;
                    index < band.count;
                    index += 1
                ) {
                    this.dustParticles
                        .push({
                            x: 0,
                            y: 0,

                            bandIndex,

                            lengthScale:
                                Phaser.Math.FloatBetween(
                                    0.65,
                                    1,
                                ),

                            alphaScale:
                                Phaser.Math.FloatBetween(
                                    0.72,
                                    1,
                                ),
                        });
                }
            },
        );

        this.randomizeDustPositions();
    }

    private randomizeDustPositions():
        void {
        for (
            const particle
            of this.dustParticles
        ) {
            particle.x =
                Phaser.Math.FloatBetween(
                    BRIDGE_VIEWSCREEN_RECT.x +
                        DUST_MARGIN_X,

                    BRIDGE_VIEWSCREEN_RECT.x +
                        BRIDGE_VIEWSCREEN_RECT.width -
                        DUST_MARGIN_X,
                );

            particle.y =
                Phaser.Math.FloatBetween(
                    BRIDGE_VIEWSCREEN_RECT.y +
                        DUST_MARGIN_Y,

                    BRIDGE_VIEWSCREEN_RECT.y +
                        BRIDGE_VIEWSCREEN_RECT.height -
                        DUST_MARGIN_Y,
                );
        }
    }

    private updateDust(
        deltaMs: number,
    ): void {
        const poseDeltaX =
            this.pose.offsetX -
            this.previousPoseOffsetX;

        const frameScale =
            deltaMs > 0
                ? Math.min(
                      2,
                      deltaMs /
                          (1000 / 60),
                  )
                : 0;

        // Tiny physical jink -> intentionally amplified apparent near-camera
        // dust movement. Opposite direction sells ship motion.
        this.dustMotionX =
            -poseDeltaX *
            BRIDGE_EVADE_DEBUG_CONFIG
                .dust
                .motionGain;

        for (
            const particle
            of this.dustParticles
        ) {
            const band =
                BRIDGE_EVADE_DEBUG_CONFIG
                    .dust
                    .bands[
                    particle.bandIndex
                ];

            if (!band) {
                continue;
            }

            particle.x +=
                this.dustMotionX *
                band.speedMultiplier *
                Math.max(
                    0.6,
                    frameScale,
                );

            this.wrapDustParticle(
                particle,
            );
        }

        this.renderDust();
    }

    private wrapDustParticle(
        particle: DustParticle,
    ): void {
        const minX =
            BRIDGE_VIEWSCREEN_RECT.x +
            DUST_MARGIN_X;

        const maxX =
            BRIDGE_VIEWSCREEN_RECT.x +
            BRIDGE_VIEWSCREEN_RECT.width -
            DUST_MARGIN_X;

        if (
            particle.x < minX
        ) {
            particle.x =
                maxX;

            this.randomizeParticleY(
                particle,
            );

            return;
        }

        if (
            particle.x > maxX
        ) {
            particle.x =
                minX;

            this.randomizeParticleY(
                particle,
            );
        }
    }

    private randomizeParticleY(
        particle: DustParticle,
    ): void {
        particle.y =
            Phaser.Math.FloatBetween(
                BRIDGE_VIEWSCREEN_RECT.y +
                    DUST_MARGIN_Y,

                BRIDGE_VIEWSCREEN_RECT.y +
                    BRIDGE_VIEWSCREEN_RECT.height -
                    DUST_MARGIN_Y,
            );
    }

    private renderDust(): void {
        this.dustGraphics.clear();

        if (
            this.dustAlpha <= 0
        ) {
            return;
        }

        const absMotion =
            Math.abs(
                this.dustMotionX,
            );

        const direction =
            this.dustMotionX === 0
                ? 1
                : Math.sign(
                      this.dustMotionX,
                  );

        for (
            const particle
            of this.dustParticles
        ) {
            const band =
                BRIDGE_EVADE_DEBUG_CONFIG
                    .dust
                    .bands[
                    particle.bandIndex
                ];

            if (!band) {
                continue;
            }

            const motionLength =
                absMotion *
                band.speedMultiplier *
                1.4;

            const lengthPx =
                Math.max(
                    band.minLengthPx,

                    Math.min(
                        band.maxLengthPx,

                        band.minLengthPx +
                            motionLength,
                    ),
                ) *
                particle.lengthScale;

            const alpha =
                Phaser.Math.Clamp(
                    this.dustAlpha *
                        band.alpha *
                        particle.alphaScale,
                    0,
                    1,
                );

            this.dustGraphics
                .fillStyle(
                    BRIDGE_EVADE_DEBUG_CONFIG
                        .dust
                        .color,

                    alpha,
                );

            const width =
                Math.max(
                    1,
                    Math.round(
                        lengthPx,
                    ),
                );

            const x =
                direction > 0
                    ? particle.x -
                      width
                    : particle.x;

            this.dustGraphics
                .fillRect(
                    Math.round(
                        x,
                    ),

                    Math.round(
                        particle.y,
                    ),

                    width,

                    band.thicknessPx,
                );
        }
    }

    private clearDust(): void {
        this.dustGraphics.clear();
    }

    private applyRenderedWorldOffset():
        void {
        this.restoreRenderedWorld();

        if (
            this.pose.offsetX ===
            0
        ) {
            return;
        }

        for (
            const layerKey
            of WORLD_LAYER_KEYS
        ) {
            const objects =
                this.scene.layers
                    .get(
                        layerKey,
                    )
                    .getChildren();

            for (
                const object
                of objects
            ) {
                if (
                    object ===
                    this.dustGraphics ||
                    !isTransformableWorldObject(
                        object,
                    )
                ) {
                    continue;
                }

                this.renderedSnapshots
                    .push({
                        object,
                        x:
                            object.x,
                    });

                object.x +=
                    this.pose.offsetX;
            }
        }
    }

    private restoreRenderedWorld():
        void {
        for (
            const snapshot
            of this.renderedSnapshots
        ) {
            snapshot.object.x =
                snapshot.x;
        }

        this.renderedSnapshots.length =
            0;
    }
}

function getEvadePose(
    progress: number,
): DebugEvadePose {
    const keyframes =
        BRIDGE_EVADE_DEBUG_CONFIG
            .evadeKeyframes;

    const clampedProgress =
        Phaser.Math.Clamp(
            progress,
            0,
            1,
        );

    for (
        let index = 1;
        index < keyframes.length;
        index += 1
    ) {
        const next =
            keyframes[index];

        const previous =
            keyframes[
                index - 1
            ];

        if (
            !next ||
            !previous
        ) {
            continue;
        }

        if (
            clampedProgress >
            next.progress
        ) {
            continue;
        }

        const span =
            next.progress -
            previous.progress;

        const localProgress =
            span <= 0
                ? 1
                : (
                      clampedProgress -
                      previous.progress
                  ) /
                  span;

        const eased =
            smoothStep(
                Phaser.Math.Clamp(
                    localProgress,
                    0,
                    1,
                ),
            );

        return {
            offsetX:
                Phaser.Math.Linear(
                    previous
                        .offsetX,

                    next
                        .offsetX,

                    eased,
                ),
        };
    }

    const last =
        keyframes[
            keyframes.length -
                1
        ];

    return {
        offsetX:
            last?.offsetX ??
            0,
    };
}

function isTransformableWorldObject(
    object:
        Phaser.GameObjects.GameObject,
): object is TransformableWorldObject {
    const candidate =
        object as unknown as {
            x?: unknown;
        };

    return (
        typeof candidate.x ===
            'number'
    );
}

function smoothStep(
    value: number,
): number {
    return (
        value *
        value *
        (
            3 -
            2 * value
        )
    );
}

function easeOutCubic(
    value: number,
): number {
    const inverse =
        1 -
        value;

    return (
        1 -
        inverse *
            inverse *
            inverse
    );
}
