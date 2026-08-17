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

type DustParticle = {
    x: number;
    y: number;

    bandIndex: number;

    lengthScale: number;
    alphaScale: number;
};

const DUST_MARGIN_X = 18;
const DUST_MARGIN_Y = 12;

// Disposable visual sandbox for player Evade.
//
// E:
// - from idle: WARMUP -> EVADING -> RETURN;
// - during WARMUP / EVADING: interrupt -> RETURN.
//
// V3:
// - WARMUP = tiny horizontal camera vibration;
// - EVADING = slightly stronger vibration + one-direction parallax dust;
// - physical world presentation itself stays in its nominal position;
// - RETURN only fades dust; there is no accumulated world offset to restore.
export default class BridgeEvadeDebugView {
    private phase:
        DebugEvadePhase =
        'idle';

    private phaseElapsedMs = 0;

    private returnStartDustAlpha = 0;

    private dustAlpha = 0;

    // Selected once per activation and kept stable for the full maneuver.
    private dustDirection:
        -1 | 1 =
        1;

    private readonly dustGraphics:
        Phaser.GameObjects.Graphics;

    private readonly dustParticles:
        DustParticle[] = [];

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
    }

    public destroy(): void {
        this.stopOwnedShake();

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

        this.advancePhase(
            safeDeltaMs,
        );

        this.updateDust(
            safeDeltaMs,
        );
    }

    private startCycle(): void {
        this.phase =
            'warmup';

        this.phaseElapsedMs =
            0;

        this.dustAlpha =
            0;

        this.returnStartDustAlpha =
            0;

        this.dustDirection =
            Math.random() < 0.5
                ? -1
                : 1;

        this.randomizeDustPositions();
        this.clearDust();

        this.startHorizontalShake(
            BRIDGE_EVADE_DEBUG_CONFIG
                .warmupDurationMs,

            BRIDGE_EVADE_DEBUG_CONFIG
                .shake
                .warmupIntensityX,
        );
    }

    private startReturn(): void {
        this.stopOwnedShake();

        this.phase =
            'returning';

        this.phaseElapsedMs =
            0;

        this.returnStartDustAlpha =
            this.dustAlpha;
    }

    private advancePhase(
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

            this.updatePhasePresentation();

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

    private updatePhasePresentation():
        void {
        switch (this.phase) {
            case 'warmup':
                this.dustAlpha =
                    0;
                return;

            case 'evading': {
                const config =
                    BRIDGE_EVADE_DEBUG_CONFIG
                        .dust;

                const fadeInProgress =
                    config.fadeInMs <= 0
                        ? 1
                        : Phaser.Math.Clamp(
                              this.phaseElapsedMs /
                                  config.fadeInMs,
                              0,
                              1,
                          );

                const alphaPulse =
                    1 -
                    config.alphaPulseAmplitude +
                    config.alphaPulseAmplitude *
                        (
                            0.5 +
                            0.5 *
                                Math.sin(
                                    this.phaseElapsedMs /
                                        1000 *
                                        Math.PI *
                                        2 *
                                        config.alphaPulseHz,
                                )
                        );

                this.dustAlpha =
                    config.evadeAlpha *
                    smoothStep(
                        fadeInProgress,
                    ) *
                    alphaPulse;

                return;
            }

            case 'returning': {
                const progress =
                    Phaser.Math.Clamp(
                        this.phaseElapsedMs /
                            BRIDGE_EVADE_DEBUG_CONFIG
                                .returnDurationMs,
                        0,
                        1,
                    );

                this.dustAlpha =
                    Phaser.Math.Linear(
                        this.returnStartDustAlpha,
                        0,
                        easeOutCubic(
                            progress,
                        ),
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

                this.dustAlpha =
                    0;

                this.startHorizontalShake(
                    BRIDGE_EVADE_DEBUG_CONFIG
                        .evadeDurationMs,

                    BRIDGE_EVADE_DEBUG_CONFIG
                        .shake
                        .evadeIntensityX,
                );

                return;

            case 'evading':
                this.startReturn();
                return;

            case 'returning':
                this.phase =
                    'idle';

                this.phaseElapsedMs =
                    0;

                this.dustAlpha =
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

    private startHorizontalShake(
        durationMs: number,
        intensityX: number,
    ): void {
        this.scene.cameras.main
            .shake(
                durationMs,

                new Phaser.Math.Vector2(
                    intensityX,
                    0,
                ),

                true,
            );
    }

    private stopOwnedShake(): void {
        this.scene.cameras.main
            .shakeEffect
            .reset();
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
        if (
            this.phase ===
                'warmup' ||
            this.phase ===
                'idle'
        ) {
            this.clearDust();
            return;
        }

        const config =
            BRIDGE_EVADE_DEBUG_CONFIG
                .dust;

        const elapsedSeconds =
            this.phase ===
                'evading'
                ? this.phaseElapsedMs /
                  1000
                : 0;

        const speedPulse =
            1 +
            config.speedPulseAmplitude *
                Math.sin(
                    elapsedSeconds *
                        Math.PI *
                        2 *
                        config.speedPulseHz,
                );

        const deltaSeconds =
            deltaMs /
            1000;

        for (
            const particle
            of this.dustParticles
        ) {
            const band =
                config.bands[
                    particle.bandIndex
                ];

            if (!band) {
                continue;
            }

            particle.x +=
                this.dustDirection *
                config.baseSpeedPxPerSecond *
                speedPulse *
                band.speedMultiplier *
                deltaSeconds;

            this.wrapDustParticle(
                particle,
            );
        }

        this.renderDust(
            speedPulse,
        );
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

    private renderDust(
        speedPulse: number,
    ): void {
        this.dustGraphics.clear();

        if (
            this.dustAlpha <= 0
        ) {
            return;
        }

        const config =
            BRIDGE_EVADE_DEBUG_CONFIG
                .dust;

        for (
            const particle
            of this.dustParticles
        ) {
            const band =
                config.bands[
                    particle.bandIndex
                ];

            if (!band) {
                continue;
            }

            const lengthProgress =
                Phaser.Math.Clamp(
                    (
                        speedPulse -
                        (
                            1 -
                            config
                                .speedPulseAmplitude
                        )
                    ) /
                        Math.max(
                            0.0001,

                            config
                                .speedPulseAmplitude *
                                2,
                        ),
                    0,
                    1,
                );

            const lengthPx =
                Phaser.Math.Linear(
                    band.minLengthPx,
                    band.maxLengthPx,
                    lengthProgress,
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
                    config.color,
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
                this.dustDirection >
                    0
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
