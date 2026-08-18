// src/app/scenes/game/bridge/view/combat/outgoing_missiles/self_destruct/BridgeOutgoingMissileSelfDestructView.ts

import type BridgeScene from "../../../../BridgeScene";

type BridgeOutgoingMissileSelfDestructViewOptions = {
    scene: BridgeScene;

    parent: Phaser.GameObjects.Container;

    position: Phaser.Math.Vector2;

    onComplete: (view: BridgeOutgoingMissileSelfDestructView) => void;
};

const OUTGOING_MISSILE_SELF_DESTRUCT_PRESENTATION = {
    durationMs: 220,
    coreDurationMs: 90,

    coreSizePx: 5,
    fragmentSizePx: 2,
    fragmentTravelPx: 18,

    hotColor: 0xffd36a,
    coolColor: 0xff5b33,

    fragments: [
        {
            x: -1.0,
            y: -0.35,
        },
        {
            x: -0.75,
            y: 0.7,
        },
        {
            x: -0.15,
            y: -1.0,
        },
        {
            x: 0.35,
            y: 0.95,
        },
        {
            x: 0.7,
            y: -0.7,
        },
        {
            x: 1.0,
            y: 0.15,
        },
        {
            x: 0.8,
            y: 0.65,
        },
    ],
} as const;

// Small presentation-only breakup after an Evade MISS.
// It deliberately does not reuse the hull-impact flash:
// no radial blast, no shake, no gameplay event.
export default class BridgeOutgoingMissileSelfDestructView {
    private readonly graphics: Phaser.GameObjects.Graphics;

    private elapsedMs = 0;

    private isDestroyed = false;

    constructor({ scene, parent, position, onComplete }: BridgeOutgoingMissileSelfDestructViewOptions) {
        this.graphics = scene.add.graphics();

        this.graphics.setPosition(position.x, position.y);

        parent.add(this.graphics);

        scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleUpdate, this);

        this.render(0);

        this.onComplete = onComplete;
    }

    private readonly onComplete: (view: BridgeOutgoingMissileSelfDestructView) => void;

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.graphics.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.handleUpdate, this);

        this.graphics.destroy();
    }

    private handleUpdate(_time: number, deltaMs: number): void {
        if (this.isDestroyed) {
            return;
        }

        this.elapsedMs += Math.max(0, deltaMs);

        const progress = Phaser.Math.Clamp(
            this.elapsedMs / OUTGOING_MISSILE_SELF_DESTRUCT_PRESENTATION.durationMs,
            0,
            1,
        );

        this.render(progress);

        if (progress < 1) {
            return;
        }

        this.destroy();
        this.onComplete(this);
    }

    private render(progress: number): void {
        const config = OUTGOING_MISSILE_SELF_DESTRUCT_PRESENTATION;

        const graphics = this.graphics;

        graphics.clear();

        const fragmentProgress = 1 - Math.pow(1 - progress, 2);

        const fragmentAlpha = 1 - progress;

        const coreProgress = Phaser.Math.Clamp((progress * config.durationMs) / config.coreDurationMs, 0, 1);

        const coreSize = Math.max(0, Math.round(Phaser.Math.Linear(config.coreSizePx, 0, coreProgress)));

        if (coreSize > 0) {
            graphics.fillStyle(config.hotColor, 1 - coreProgress);

            graphics.fillRect(Math.round(-coreSize / 2), Math.round(-coreSize / 2), coreSize, coreSize);
        }

        const fragmentSize = Math.max(1, Math.round(Phaser.Math.Linear(config.fragmentSizePx, 1, progress)));

        for (let index = 0; index < config.fragments.length; index += 1) {
            const fragment = config.fragments[index];

            const directionLength = Math.hypot(fragment.x, fragment.y);

            if (directionLength <= Number.EPSILON) {
                continue;
            }

            const travelPx = config.fragmentTravelPx * fragmentProgress;

            graphics.fillStyle(index % 2 === 0 ? config.hotColor : config.coolColor, fragmentAlpha);

            graphics.fillRect(
                Math.round((fragment.x / directionLength) * travelPx - fragmentSize / 2),
                Math.round((fragment.y / directionLength) * travelPx - fragmentSize / 2),
                fragmentSize,
                fragmentSize,
            );
        }
    }
}
