// src/app/scenes/game/bridge/view/combat/outgoing_sticky_mines/miss/BridgeOutgoingStickyMineMissView.ts

import { MINE_SPRITE_ID, MINE_SPRITES } from "../../../../../../../manifests/combat/mines/mine_sprite";
import type BridgeScene from "../../../../BridgeScene";

type BridgeOutgoingStickyMineMissViewOptions = {
    scene: BridgeScene;

    parent: Phaser.GameObjects.Container;

    mineId: string;

    startPosition: Phaser.Math.Vector2;

    targetBasePosition: Phaser.Math.Vector2;

    targetVisualBounds: Phaser.Geom.Rectangle;

    onComplete: (view: BridgeOutgoingStickyMineMissView) => void;
};

const OUTGOING_STICKY_MINE_MISS_PRESENTATION = {
    flightDurationMs: 160,

    clearancePx: 8,
    bendPx: 48,

    startScale: 0.16,
    endScale: 0.43,

    selfDestruct: {
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
    },
} as const;

// Presentation-only flight for a player sticky mine whose attachment attempt
// already resolved as MISS in the engine.
//
// The target visual bounds are captured at the MISS event. The path bends to
// the side opposite the enemy's current Evade presentation offset, exits only
// 8px beyond the silhouette, then uses the same small pixel-breakup grammar as
// the accepted outgoing-missile self-destruct.
//
// No attached mine/fuse is ever presented.
export default class BridgeOutgoingStickyMineMissView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly image: Phaser.GameObjects.Image;

    private readonly burst: Phaser.GameObjects.Graphics;

    private readonly startPosition: Phaser.Math.Vector2;

    private readonly controlPosition: Phaser.Math.Vector2;

    private readonly endPosition: Phaser.Math.Vector2;

    private elapsedMs = 0;

    private phase: "flight" | "self_destruct" = "flight";

    private isDestroyed = false;

    constructor({
        scene,
        parent,
        mineId,
        startPosition,
        targetBasePosition,
        targetVisualBounds,
        onComplete,
    }: BridgeOutgoingStickyMineMissViewOptions) {
        this.scene = scene;

        this.onComplete = onComplete;

        this.startPosition = startPosition.clone();

        const missSide = this.getMissSide(mineId, targetBasePosition, targetVisualBounds);

        this.endPosition = this.createEndPosition(targetVisualBounds, missSide);

        this.controlPosition = this.createControlPosition(this.startPosition, this.endPosition, missSide);

        this.root = scene.add.container(this.startPosition.x, this.startPosition.y);

        parent.add(this.root);

        const sprite = MINE_SPRITES[MINE_SPRITE_ID.STICKY_00];

        this.image = scene.add
            .image(
                0,
                0,

                sprite.atlasKey,
                sprite.frameKey,
            )
            .setScale(OUTGOING_STICKY_MINE_MISS_PRESENTATION.startScale);

        this.burst = scene.add.graphics();

        this.root.add(this.image);

        this.root.add(this.burst);

        scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleUpdate, this);
    }

    private readonly scene: BridgeScene;

    private readonly onComplete: (view: BridgeOutgoingStickyMineMissView) => void;

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.handleUpdate, this);

        this.root.destroy(true);
    }

    private handleUpdate(_time: number, deltaMs: number): void {
        if (this.isDestroyed) {
            return;
        }

        this.elapsedMs += Math.max(0, deltaMs);

        if (this.phase === "flight") {
            this.updateFlight();

            return;
        }

        this.updateSelfDestruct();
    }

    private updateFlight(): void {
        const config = OUTGOING_STICKY_MINE_MISS_PRESENTATION;

        const progress = Phaser.Math.Clamp(this.elapsedMs / config.flightDurationMs, 0, 1);

        // Match the normal sticky-mine flight's Quad.In character:
        // most of the speed arrives near the target, so the mine does not
        // linger over the enemy silhouette before reaching the 8px exit.
        const motionProgress = progress * progress;

        const inverseProgress = 1 - motionProgress;

        this.root.setPosition(
            inverseProgress * inverseProgress * this.startPosition.x +
                2 * inverseProgress * motionProgress * this.controlPosition.x +
                motionProgress * motionProgress * this.endPosition.x,

            inverseProgress * inverseProgress * this.startPosition.y +
                2 * inverseProgress * motionProgress * this.controlPosition.y +
                motionProgress * motionProgress * this.endPosition.y,
        );

        const scale = Phaser.Math.Linear(config.startScale, config.endScale, motionProgress);

        this.image.setScale(scale);

        if (progress < 1) {
            return;
        }

        this.phase = "self_destruct";

        this.elapsedMs = 0;

        this.image.setVisible(false);

        this.renderSelfDestruct(0);
    }

    private updateSelfDestruct(): void {
        const config = OUTGOING_STICKY_MINE_MISS_PRESENTATION.selfDestruct;

        const progress = Phaser.Math.Clamp(this.elapsedMs / config.durationMs, 0, 1);

        this.renderSelfDestruct(progress);

        if (progress < 1) {
            return;
        }

        this.destroy();

        this.onComplete(this);
    }

    private getMissSide(
        mineId: string,

        targetBasePosition: Phaser.Math.Vector2,

        targetVisualBounds: Phaser.Geom.Rectangle,
    ): -1 | 1 {
        const presentationOffsetX = targetVisualBounds.centerX - targetBasePosition.x;

        if (Math.abs(presentationOffsetX) > 1) {
            return presentationOffsetX > 0 ? -1 : 1;
        }

        let hash = 0;

        for (let index = 0; index < mineId.length; index += 1) {
            hash += mineId.charCodeAt(index);
        }

        return hash % 2 === 0 ? -1 : 1;
    }

    private createEndPosition(
        targetVisualBounds: Phaser.Geom.Rectangle,

        missSide: -1 | 1,
    ): Phaser.Math.Vector2 {
        const clearancePx = OUTGOING_STICKY_MINE_MISS_PRESENTATION.clearancePx;

        return new Phaser.Math.Vector2(
            missSide < 0 ? targetVisualBounds.left - clearancePx : targetVisualBounds.right + clearancePx,

            targetVisualBounds.centerY,
        );
    }

    private createControlPosition(
        startPosition: Phaser.Math.Vector2,

        endPosition: Phaser.Math.Vector2,

        missSide: -1 | 1,
    ): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(
            Phaser.Math.Linear(startPosition.x, endPosition.x, 0.72) +
                missSide * OUTGOING_STICKY_MINE_MISS_PRESENTATION.bendPx,

            Phaser.Math.Linear(startPosition.y, endPosition.y, 0.72),
        );
    }

    private renderSelfDestruct(progress: number): void {
        const config = OUTGOING_STICKY_MINE_MISS_PRESENTATION.selfDestruct;

        const graphics = this.burst;

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
