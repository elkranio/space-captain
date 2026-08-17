// src/app/scenes/game/bridge/debug_view/enemy_evade/BridgeEnemyEvadeDebugView.ts

import type BridgeScene from '../../BridgeScene';
import {
    BRIDGE_ENEMY_EVADE_DEBUG_CONFIG,
} from './bridge_enemy_evade_debug_config';

type DebugEnemyEvadePhase =
    | 'idle'
    | 'warmup'
    | 'evading'
    | 'returning';

type EnemyShipTarget = {
    image:
        Phaser.GameObjects.Image;

    objectRoot:
        Phaser.GameObjects.Container;
};

type ThrusterParticle = {
    x: number;
    y: number;

    velocityX: number;
    velocityY: number;

    lifeMs: number;
    maxLifeMs: number;

    lengthPx: number;
    color: number;
};

const SHIP_FRAME_PREFIX =
    'ships/chassis/';

// Disposable enemy Evade visual sandbox.
//
// R:
// - idle -> WARMUP -> EVADING -> RETURN;
// - WARMUP/EVADING -> interrupt -> RETURN.
//
// The real encounter object position is never changed.
// During POST_UPDATE only the chassis object root gets a visual X offset.
// PRE_UPDATE restores it before normal bridge presentation runs.
//
// Thruster exhaust is drawn in VFX space:
// - low-rate prefire during warmup;
// - strong burst while the ship accelerates sideways;
// - sustained smaller output during active Evade;
// - opposite-side braking plume during return/interruption.
export default class BridgeEnemyEvadeDebugView {
    private phase:
        DebugEnemyEvadePhase =
        'idle';

    private phaseElapsedMs = 0;

    private evadeDirection:
        -1 | 1 =
        1;

    private offsetX = 0;
    private returnStartOffsetX = 0;

    private spawnAccumulator = 0;

    private renderedRoot?:
        Phaser.GameObjects.Container;

    private renderedRootX = 0;

    private readonly particles:
        ThrusterParticle[] =
        [];

    private readonly graphics:
        Phaser.GameObjects.Graphics;

    constructor(
        private readonly scene:
            BridgeScene,
    ) {
        this.graphics =
            this.scene.add.graphics();

        this.scene.layers
            .get('vfx')
            .add(
                this.graphics,
            );

        this.scene.input.keyboard?.on(
            'keydown-R',
            this.handleKeyDown,
            this,
        );

        this.scene.events.on(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );

        this.scene.events.on(
            Phaser.Scenes.Events.PRE_UPDATE,
            this.handlePreUpdate,
            this,
        );

        this.scene.events.on(
            Phaser.Scenes.Events.POST_UPDATE,
            this.handlePostUpdate,
            this,
        );
    }

    public destroy(): void {
        this.restoreRenderedShip();

        this.scene.input.keyboard?.off(
            'keydown-R',
            this.handleKeyDown,
            this,
        );

        this.scene.events.off(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );

        this.scene.events.off(
            Phaser.Scenes.Events.PRE_UPDATE,
            this.handlePreUpdate,
            this,
        );

        this.scene.events.off(
            Phaser.Scenes.Events.POST_UPDATE,
            this.handlePostUpdate,
            this,
        );

        this.particles.length =
            0;

        this.graphics.destroy();
    }

    private handleKeyDown(
        event: KeyboardEvent,
    ): void {
        if (event.repeat) {
            return;
        }

        if (
            this.phase ===
            'idle'
        ) {
            if (
                !this.findEnemyShipTarget()
            ) {
                return;
            }

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
        const safeDeltaMs =
            Math.max(
                0,
                deltaMs,
            );

        if (
            this.phase !==
            'idle'
        ) {
            if (
                !this.findEnemyShipTarget()
            ) {
                this.resetCycle();
            } else {
                this.advancePhase(
                    safeDeltaMs,
                );

                this.spawnThrusterParticles(
                    safeDeltaMs,
                );
            }
        }

        this.updateParticles(
            safeDeltaMs,
        );

        this.renderParticles();
    }

    private handlePreUpdate(): void {
        this.restoreRenderedShip();
    }

    private handlePostUpdate(): void {
        this.applyRenderedShipOffset();
    }

    private startCycle(): void {
        this.phase =
            'warmup';

        this.phaseElapsedMs =
            0;

        this.evadeDirection =
            Math.random() < 0.5
                ? -1
                : 1;

        this.offsetX =
            0;

        this.returnStartOffsetX =
            0;

        this.spawnAccumulator =
            0;
    }

    private startReturn(): void {
        this.phase =
            'returning';

        this.phaseElapsedMs =
            0;

        this.returnStartOffsetX =
            this.offsetX;

        this.spawnAccumulator =
            0;
    }

    private resetCycle(): void {
        this.restoreRenderedShip();

        this.phase =
            'idle';

        this.phaseElapsedMs =
            0;

        this.offsetX =
            0;

        this.returnStartOffsetX =
            0;

        this.spawnAccumulator =
            0;
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

            this.updateOffset();

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
                return BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                    .warmupDurationMs;

            case 'evading':
                return BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                    .evadeDurationMs;

            case 'returning':
                return BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
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

    private updateOffset(): void {
        switch (this.phase) {
            case 'warmup':
                this.offsetX =
                    0;

                return;

            case 'evading': {
                const entryDurationMs =
                    BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                        .movement
                        .entryDurationMs;

                const progress =
                    entryDurationMs <= 0
                        ? 1
                        : Phaser.Math.Clamp(
                              this.phaseElapsedMs /
                                  entryDurationMs,
                              0,
                              1,
                          );

                this.offsetX =
                    this.evadeDirection *
                    BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                        .movement
                        .maxOffsetPx *
                    smoothStep(
                        progress,
                    );

                return;
            }

            case 'returning': {
                const progress =
                    Phaser.Math.Clamp(
                        this.phaseElapsedMs /
                            BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                                .returnDurationMs,
                        0,
                        1,
                    );

                this.offsetX =
                    Phaser.Math.Linear(
                        this.returnStartOffsetX,
                        0,
                        smoothStep(
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

                this.offsetX =
                    0;

                this.spawnAccumulator =
                    0;

                return;

            case 'evading':
                this.startReturn();
                return;

            case 'returning':
                this.resetCycle();
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

    private spawnThrusterParticles(
        deltaMs: number,
    ): void {
        const target =
            this.findEnemyShipTarget();

        if (!target) {
            return;
        }

        const spawnRate =
            this.getCurrentSpawnRate();

        if (
            spawnRate <= 0
        ) {
            return;
        }

        this.spawnAccumulator +=
            deltaMs /
            1000 *
            spawnRate;

        while (
            this.spawnAccumulator >=
            1
        ) {
            this.spawnAccumulator -=
                1;

            this.spawnParticlePair(
                target,
            );
        }
    }

    private getCurrentSpawnRate():
        number {
        const config =
            BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                .thrusters;

        switch (this.phase) {
            case 'warmup':
                return config
                    .warmupSpawnPerSecond;

            case 'evading':
                return (
                    this.phaseElapsedMs <=
                    config
                        .activeBurstDurationMs
                )
                    ? config
                          .burstSpawnPerSecond
                    : config
                          .sustainSpawnPerSecond;

            case 'returning':
                return config
                    .returnSpawnPerSecond;

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

    private spawnParticlePair(
        target: EnemyShipTarget,
    ): void {
        const bounds =
            target.image
                .getBounds();

        const movementDirection =
            this.getThrusterMovementDirection();

        const emitterX =
            movementDirection > 0
                ? bounds.left +
                  this.offsetX
                : bounds.right +
                  this.offsetX;

        const verticalOffset =
            bounds.height *
            BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                .thrusters
                .emitterVerticalOffsetRatio;

        this.spawnParticle(
            emitterX,
            bounds.centerY -
                verticalOffset,
            movementDirection,
        );

        this.spawnParticle(
            emitterX,
            bounds.centerY +
                verticalOffset,
            movementDirection,
        );
    }

    private getThrusterMovementDirection():
        -1 | 1 {
        if (
            this.phase ===
            'returning'
        ) {
            return (
                -this.evadeDirection
            ) as -1 | 1;
        }

        return this.evadeDirection;
    }

    private spawnParticle(
        emitterX: number,
        emitterY: number,
        movementDirection:
            -1 | 1,
    ): void {
        const config =
            BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                .thrusters;

        const speed =
            Phaser.Math.FloatBetween(
                config
                    .minSpeedPxPerSecond,
                config
                    .maxSpeedPxPerSecond,
            );

        const maxLifeMs =
            Phaser.Math.Between(
                config.minLifeMs,
                config.maxLifeMs,
            );

        const colors =
            config.colors;

        const color =
            colors[
                Phaser.Math.Between(
                    0,
                    colors.length - 1,
                )
            ] ??
            0xffffff;

        this.particles.push({
            x:
                emitterX,

            y:
                emitterY +
                Phaser.Math.FloatBetween(
                    -config.yJitterPx,
                    config.yJitterPx,
                ),

            // Exhaust travels opposite to the lateral ship impulse.
            velocityX:
                -movementDirection *
                speed,

            velocityY:
                Phaser.Math.FloatBetween(
                    -18,
                    18,
                ),

            lifeMs:
                maxLifeMs,

            maxLifeMs,

            lengthPx:
                Phaser.Math.Between(
                    config.minLengthPx,
                    config.maxLengthPx,
                ),

            color,
        });
    }

    private updateParticles(
        deltaMs: number,
    ): void {
        const deltaSeconds =
            deltaMs /
            1000;

        for (
            let index =
                this.particles.length - 1;
            index >= 0;
            index -= 1
        ) {
            const particle =
                this.particles[index];

            if (!particle) {
                continue;
            }

            particle.lifeMs -=
                deltaMs;

            if (
                particle.lifeMs <= 0
            ) {
                this.particles.splice(
                    index,
                    1,
                );

                continue;
            }

            particle.x +=
                particle.velocityX *
                deltaSeconds;

            particle.y +=
                particle.velocityY *
                deltaSeconds;
        }
    }

    private renderParticles(): void {
        this.graphics.clear();

        for (
            const particle
            of this.particles
        ) {
            const lifeProgress =
                Phaser.Math.Clamp(
                    particle.lifeMs /
                        particle.maxLifeMs,
                    0,
                    1,
                );

            const alpha =
                smoothStep(
                    lifeProgress,
                );

            this.graphics
                .fillStyle(
                    particle.color,
                    alpha,
                );

            const direction =
                Math.sign(
                    particle.velocityX,
                );

            const x =
                direction > 0
                    ? particle.x
                    : particle.x -
                      particle.lengthPx;

            this.graphics
                .fillRect(
                    Math.round(
                        x,
                    ),
                    Math.round(
                        particle.y,
                    ),
                    particle.lengthPx,
                    2,
                );
        }
    }

    private applyRenderedShipOffset():
        void {
        this.restoreRenderedShip();

        if (
            this.offsetX ===
            0
        ) {
            return;
        }

        const target =
            this.findEnemyShipTarget();

        if (!target) {
            return;
        }

        this.renderedRoot =
            target.objectRoot;

        this.renderedRootX =
            target.objectRoot.x;

        target.objectRoot.x +=
            this.offsetX;
    }

    private restoreRenderedShip():
        void {
        if (
            !this.renderedRoot
        ) {
            return;
        }

        this.renderedRoot.x =
            this.renderedRootX;

        this.renderedRoot =
            undefined;

        this.renderedRootX =
            0;
    }

    private findEnemyShipTarget():
        EnemyShipTarget | undefined {
        const layerChildren =
            this.scene.layers
                .get('objects')
                .getChildren();

        const image =
            findShipImage(
                layerChildren,
            );

        if (!image) {
            return undefined;
        }

        const visualRoot =
            image.parentContainer;

        const objectRoot =
            visualRoot
                ?.parentContainer;

        if (
            !visualRoot ||
            !objectRoot
        ) {
            return undefined;
        }

        return {
            image,
            objectRoot,
        };
    }
}

function findShipImage(
    gameObjects:
        readonly Phaser.GameObjects.GameObject[],
): Phaser.GameObjects.Image | undefined {
    for (
        const gameObject
        of gameObjects
    ) {
        if (
            gameObject instanceof
                Phaser.GameObjects.Image &&
            String(
                gameObject
                    .frame
                    .name,
            ).startsWith(
                SHIP_FRAME_PREFIX,
            )
        ) {
            return gameObject;
        }

        if (
            gameObject instanceof
            Phaser.GameObjects.Container
        ) {
            const nested =
                findShipImage(
                    gameObject.list,
                );

            if (nested) {
                return nested;
            }
        }
    }

    return undefined;
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
