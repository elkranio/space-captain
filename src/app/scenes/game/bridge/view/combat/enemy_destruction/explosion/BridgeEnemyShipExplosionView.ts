// src/app/scenes/game/bridge/view/combat/enemy_destruction/explosion/BridgeEnemyShipExplosionView.ts

import type BridgeScene from '../../../../BridgeScene';

type BridgeEnemyShipExplosionViewOptions = {
    scene: BridgeScene;

    parent:
        Phaser.GameObjects.Container;

    position:
        Phaser.Math.Vector2;

    onComplete: () => void;
};

type ExplosionParticle = {
    angle: number;
    speed: number;

    size: number;
    delayMs: number;

    color: number;
};

const EXPLOSION = {
    durationMs: 600,

    flashDurationMs: 120,

    particleCount: 20,

    speedMin: 42,
    speedMax: 105,

    delayMaxMs: 90,

    outlineColor: 0x07182a,

    colors: [
        0xfff0b2,
        0xffbd4a,
        0xea6f2d,
        0xa83232,
    ],
} as const;

// Короткий VGA-style explosion без asset:
// flash + крупные квадратные частицы.
export default class BridgeEnemyShipExplosionView {
    private readonly graphics:
        Phaser.GameObjects.Graphics;

    private readonly particles:
        ExplosionParticle[];

    private elapsedMs = 0;

    private completed = false;
    private destroyed = false;

    constructor({
        scene,
        parent,

        position,

        onComplete,
    }: BridgeEnemyShipExplosionViewOptions) {
        this.scene = scene;

        this.onComplete =
            onComplete;

        this.particles =
            this.createParticles();

        this.graphics =
            scene.add.graphics();

        this.graphics.setPosition(
            Math.round(position.x),
            Math.round(position.y),
        );

        parent.add(this.graphics);

        this.draw();

        this.scene.events.on(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );
    }

    private readonly scene:
        BridgeScene;

    private readonly onComplete:
        () => void;

    public destroy(): void {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        this.scene.events.off(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );

        this.graphics.destroy();
    }

    private handleSceneUpdate(
        _time: number,
        deltaMs: number,
    ): void {
        if (this.completed) {
            return;
        }

        this.elapsedMs += deltaMs;

        if (
            this.elapsedMs >=
            EXPLOSION.durationMs
        ) {
            this.completed = true;
            this.onComplete();

            return;
        }

        this.draw();
    }

    private createParticles():
        ExplosionParticle[] {
        return Array.from(
            {
                length:
                    EXPLOSION.particleCount,
            },

            (_unused, index) => {
                const color =
                    EXPLOSION.colors[
                        index %
                            EXPLOSION
                                .colors
                                .length
                    ];

                if (
                    color === undefined
                ) {
                    throw new Error(
                        'Explosion particle ' +
                            'color not found: ' +
                            index,
                    );
                }

                return {
                    angle:
                        (index /
                            EXPLOSION
                                .particleCount) *
                            Math.PI *
                            2 +
                        Phaser.Math
                            .FloatBetween(
                                -0.18,
                                0.18,
                            ),

                    speed:
                        Phaser.Math.Between(
                            EXPLOSION
                                .speedMin,

                            EXPLOSION
                                .speedMax,
                        ),

                    size:
                        Phaser.Math.Between(
                            2,
                            5,
                        ),

                    delayMs:
                        Phaser.Math.Between(
                            0,
                            EXPLOSION
                                .delayMaxMs,
                        ),

                    color,
                };
            },
        );
    }

    private draw(): void {
        this.graphics.clear();

        this.drawFlash();

        for (
            const particle of
            this.particles
        ) {
            this.drawParticle(
                particle,
            );
        }
    }

    private drawFlash(): void {
        if (
            this.elapsedMs >=
            EXPLOSION.flashDurationMs
        ) {
            return;
        }

        const progress =
            Phaser.Math.Clamp(
                this.elapsedMs /
                    EXPLOSION
                        .flashDurationMs,

                0,
                1,
            );

        const size = Math.round(
            Phaser.Math.Linear(
                34,
                8,
                progress,
            ),
        );

        const alpha =
            1 - progress;

        this.graphics.fillStyle(
            EXPLOSION.outlineColor,
            alpha,
        );

        this.graphics.fillRect(
            -Math.floor(
                (size + 6) / 2,
            ),

            -Math.floor(
                (size + 6) / 2,
            ),

            size + 6,
            size + 6,
        );

        this.graphics.fillStyle(
            0xfff0b2,
            alpha,
        );

        this.graphics.fillRect(
            -Math.floor(
                size / 2,
            ),

            -Math.floor(
                size / 2,
            ),

            size,
            size,
        );

        const crossLength =
            size + 24;

        this.graphics.fillRect(
            -Math.floor(
                crossLength / 2,
            ),

            -2,

            crossLength,
            4,
        );

        this.graphics.fillRect(
            -2,

            -Math.floor(
                crossLength / 2,
            ),

            4,
            crossLength,
        );
    }

    private drawParticle(
        particle:
            ExplosionParticle,
    ): void {
        const ageMs =
            this.elapsedMs -
            particle.delayMs;

        if (ageMs < 0) {
            return;
        }

        const activeDurationMs =
            EXPLOSION.durationMs -
            particle.delayMs;

        const progress =
            Phaser.Math.Clamp(
                ageMs /
                    activeDurationMs,

                0,
                1,
            );

        const distance =
            particle.speed *
            (ageMs / 1000);

        const x = Math.round(
            Math.cos(
                particle.angle,
            ) *
                distance,
        );

        const y = Math.round(
            Math.sin(
                particle.angle,
            ) *
                distance +
                progress *
                    progress *
                    10,
        );

        const alpha =
            Phaser.Math.Clamp(
                1 -
                    Math.max(
                        0,
                        progress - 0.45,
                    ) /
                        0.55,

                0,
                1,
            );

        const size =
            progress < 0.72
                ? particle.size
                : Math.max(
                      1,
                      particle.size - 2,
                  );

        this.graphics.fillStyle(
            EXPLOSION.outlineColor,
            alpha,
        );

        this.graphics.fillRect(
            x -
                Math.floor(
                    (size + 2) / 2,
                ),

            y -
                Math.floor(
                    (size + 2) / 2,
                ),

            size + 2,
            size + 2,
        );

        this.graphics.fillStyle(
            particle.color,
            alpha,
        );

        this.graphics.fillRect(
            x -
                Math.floor(
                    size / 2,
                ),

            y -
                Math.floor(
                    size / 2,
                ),

            size,
            size,
        );
    }
}
