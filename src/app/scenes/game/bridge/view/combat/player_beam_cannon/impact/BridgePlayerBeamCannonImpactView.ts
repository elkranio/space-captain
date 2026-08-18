// src/app/scenes/game/bridge/view/combat/player_beam_cannon/impact/BridgePlayerBeamCannonImpactView.ts

import type BridgeScene from "../../../../BridgeScene";

type BridgePlayerBeamCannonImpactViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    position: Phaser.Math.Vector2;

    blocked: boolean;

    onComplete: () => void;
};

const IMPACT = {
    durationMs: 260,

    outlineColor: 0x07182a,

    shieldColor: 0x43d9ff,
    shieldHotColor: 0xd7f9ff,

    hullColor: 0xea9e3e,
    hullHotColor: 0xffe6a3,
} as const;

// Короткий pixel impact:
// cyan square-wave для shield,
// orange sparks для hull.
export default class BridgePlayerBeamCannonImpactView {
    private readonly graphics: Phaser.GameObjects.Graphics;

    private elapsedMs = 0;

    private destroyed = false;

    constructor({
        scene,
        parent,

        position,

        blocked,

        onComplete,
    }: BridgePlayerBeamCannonImpactViewOptions) {
        this.scene = scene;

        this.blocked = blocked;

        this.onComplete = onComplete;

        this.graphics = scene.add.graphics();

        this.graphics.setPosition(Math.round(position.x), Math.round(position.y));

        parent.add(this.graphics);

        this.draw();

        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);
    }

    private readonly scene: BridgeScene;

    private readonly blocked: boolean;

    private readonly onComplete: () => void;

    public destroy(): void {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);

        this.graphics.destroy();
    }

    private handleSceneUpdate(_time: number, deltaMs: number): void {
        this.elapsedMs += deltaMs;

        if (this.elapsedMs >= IMPACT.durationMs) {
            this.onComplete();
            return;
        }

        this.draw();
    }

    private draw(): void {
        this.graphics.clear();

        const progress = Phaser.Math.Clamp(
            this.elapsedMs / IMPACT.durationMs,

            0,
            1,
        );

        const alpha = 1 - progress;

        if (this.blocked) {
            this.drawShieldImpact(progress, alpha);

            return;
        }

        this.drawHullImpact(progress, alpha);
    }

    private drawShieldImpact(progress: number, alpha: number): void {
        const halfSize = Math.round(Phaser.Math.Linear(5, 20, progress));

        this.graphics.lineStyle(4, IMPACT.outlineColor, alpha);

        this.graphics.strokeRect(
            -halfSize - 2,
            -halfSize - 2,

            (halfSize + 2) * 2,
            (halfSize + 2) * 2,
        );

        this.graphics.lineStyle(2, IMPACT.shieldColor, alpha);

        this.graphics.strokeRect(
            -halfSize,
            -halfSize,

            halfSize * 2,
            halfSize * 2,
        );

        const coreSize = Math.max(2, Math.round(Phaser.Math.Linear(8, 2, progress)));

        this.graphics.fillStyle(IMPACT.shieldHotColor, alpha);

        this.graphics.fillRect(
            -Math.floor(coreSize / 2),

            -Math.floor(coreSize / 2),

            coreSize,
            coreSize,
        );
    }

    private drawHullImpact(progress: number, alpha: number): void {
        const coreSize = Math.max(2, Math.round(Phaser.Math.Linear(12, 3, progress)));

        this.graphics.fillStyle(IMPACT.outlineColor, alpha);

        this.graphics.fillRect(
            -Math.floor((coreSize + 4) / 2),

            -Math.floor((coreSize + 4) / 2),

            coreSize + 4,
            coreSize + 4,
        );

        this.graphics.fillStyle(IMPACT.hullHotColor, alpha);

        this.graphics.fillRect(
            -Math.floor(coreSize / 2),

            -Math.floor(coreSize / 2),

            coreSize,
            coreSize,
        );

        const sparkDistance = Math.round(Phaser.Math.Linear(4, 30, progress));

        const sparkSize = progress < 0.55 ? 4 : 2;

        this.graphics.fillStyle(IMPACT.hullColor, alpha);

        for (const [xDirection, yDirection] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [1, 1],
            [-1, 1],
            [1, -1],
            [-1, -1],
        ] as const) {
            const x = xDirection * sparkDistance;

            const y = yDirection * sparkDistance;

            this.graphics.fillRect(
                x - Math.floor(sparkSize / 2),

                y - Math.floor(sparkSize / 2),

                sparkSize,
                sparkSize,
            );
        }
    }
}
