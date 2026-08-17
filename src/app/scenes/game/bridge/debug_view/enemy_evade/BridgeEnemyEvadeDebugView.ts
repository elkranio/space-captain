// src/app/scenes/game/bridge/debug_view/enemy_evade/BridgeEnemyEvadeDebugView.ts

import type BridgeScene from '../../BridgeScene';
import {
    BRIDGE_ENEMY_EVADE_DEBUG_CONFIG,
} from './bridge_enemy_evade_debug_config';

type DebugEnemyEvadePhase =
    | 'idle'
    | 'warmup'
    | 'evading';

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

    strength: number;
};

const SHIP_FRAME_PREFIX =
    'ships/chassis/';

// Disposable enemy Evade visual sandbox.
//
// R:
// - idle -> WARMUP -> EVADING -> idle;
// - WARMUP/EVADING -> immediate interrupt -> idle.
//
// The encounter object itself never moves.
//
// We keep one accumulated visual X offset and apply it only during POST_UPDATE.
// PRE_UPDATE restores the real object position before normal bridge logic runs.
//
// Each activation alternates direction:
// - first activation chooses randomly;
// - every later activation uses the opposite side.
//
// There is deliberately no "return to center" phase.
// A completed/aborted maneuver simply leaves the ship where its lateral thrust
// managed to push it visually.
export default class BridgeEnemyEvadeDebugView {
    private phase:
        DebugEnemyEvadePhase =
        'idle';

    private phaseElapsedMs = 0;

    private evadeDirection:
        -1 | 1 =
        1;

    private hasChosenDirection =
        false;

    private accumulatedOffsetX = 0;

    private activeStartOffsetX = 0;

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

        this.stopCycle();
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
                this.stopCycle();
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
        this.chooseNextDirection();

        this.phase =
            'warmup';

        this.phaseElapsedMs =
            0;

        this.activeStartOffsetX =
            this.accumulatedOffsetX;

        this.spawnAccumulator =
            0;
    }

    private chooseNextDirection():
        void {
        if (
            !this.hasChosenDirection
        ) {
            this.evadeDirection =
                Math.random() < 0.5
                    ? -1
                    : 1;

            this.hasChosenDirection =
                true;

            return;
        }

        this.evadeDirection =
            (
                -this.evadeDirection
            ) as -1 | 1;
    }

    private stopCycle(): void {
        this.phase =
            'idle';

        this.phaseElapsedMs =
            0;

        this.activeStartOffsetX =
            this.accumulatedOffsetX;

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

            this.updateAccumulatedOffset();

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

    private updateAccumulatedOffset():
        void {
        if (
            this.phase !==
            'evading'
        ) {
            return;
        }

        const progress =
            Phaser.Math.Clamp(
                this.phaseElapsedMs /
                    BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                        .evadeDurationMs,
                0,
                1,
            );

        const movement =
            BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                .movement;

        // Small eased drift: the thruster sells most of the maneuver,
        // the chassis itself only accumulates a subtle lateral displacement.
        const targetOffset =
            this.activeStartOffsetX +
            this.evadeDirection *
                movement
                    .distancePerFullEvadePx *
                smoothStep(
                    progress,
                );

        this.accumulatedOffsetX =
            Phaser.Math.Clamp(
                targetOffset,
                -movement
                    .maxAccumulatedOffsetPx,
                movement
                    .maxAccumulatedOffsetPx,
            );
    }

    private completeCurrentPhase():
        void {
        switch (this.phase) {
            case 'warmup':
                this.phase =
                    'evading';

                this.phaseElapsedMs =
                    0;

                this.activeStartOffsetX =
                    this.accumulatedOffsetX;

                this.spawnAccumulator =
                    0;

                return;

            case 'evading':
                this.stopCycle();
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

        const strength =
            this.getThrusterStrength();

        if (
            strength <= 0
        ) {
            return;
        }

        const config =
            BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                .thrusters;

        this.spawnAccumulator +=
            deltaMs /
            1000 *
            config
                .activeSpawnPerSecond *
            strength;

        while (
            this.spawnAccumulator >=
            1
        ) {
            this.spawnAccumulator -=
                1;

            this.spawnParticlePair(
                target,
                strength,
            );
        }
    }

    private getThrusterStrength():
        number {
        const config =
            BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                .thrusters;

        switch (this.phase) {
            case 'warmup':
                return config
                    .warmupStrength;

            case 'evading':
                return config
                    .activeStrength;

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
        strength: number,
    ): void {
        const bounds =
            target.image
                .getBounds();

        // To move right, fire the left-side maneuvering thruster.
        // To move left, fire the right-side thruster.
        const emitterX =
            this.evadeDirection > 0
                ? bounds.left +
                  this.accumulatedOffsetX
                : bounds.right +
                  this.accumulatedOffsetX;

        const verticalOffset =
            bounds.height *
            BRIDGE_ENEMY_EVADE_DEBUG_CONFIG
                .thrusters
                .emitterVerticalOffsetRatio;

        this.spawnParticle(
            emitterX,
            bounds.centerY -
                verticalOffset,
            strength,
        );

        this.spawnParticle(
            emitterX,
            bounds.centerY +
                verticalOffset,
            strength,
        );
    }

    private spawnParticle(
        emitterX: number,
        emitterY: number,
        strength: number,
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
            ) *
            Phaser.Math.Linear(
                0.65,
                1,
                strength,
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

            // Exhaust travels opposite to the selected lateral maneuver.
            velocityX:
                -this.evadeDirection *
                speed,

            velocityY:
                Phaser.Math.FloatBetween(
                    -15,
                    15,
                ),

            lifeMs:
                maxLifeMs,

            maxLifeMs,

            lengthPx:
                Math.max(
                    1,
                    Math.round(
                        Phaser.Math.Between(
                            config.minLengthPx,
                            config.maxLengthPx,
                        ) *
                        Phaser.Math.Linear(
                            0.55,
                            1,
                            strength,
                        ),
                    ),
                ),

            color,
            strength,
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
                ) *
                Phaser.Math.Linear(
                    0.55,
                    1,
                    particle.strength,
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
            this.accumulatedOffsetX ===
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
            this.accumulatedOffsetX;
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
