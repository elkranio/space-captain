// src/app/scenes/game/bridge/view/combat/enemy_shield/BridgeEnemyShieldView.ts

import { PLAYER_SHIELD_CENTER_SPRITE } from "../../../../../../manifests/bridge/combat_shield";
import type BridgeScene from "../../../BridgeScene";
import {
    BRIDGE_EVENT,
    type BridgeEnemyShieldPayload,
    type BridgeEnemyShieldsUpdatedPayload,
    type BridgePlayerBeamCannonFiredPayload,
} from "../../../events/bridge_event";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import {
    BRIDGE_SHIELD_PRESENTATION,
    getBridgeShieldAbsorbFadeAlpha,
    getBridgeShieldAlpha,
} from "../bridge_shield_presentation";

const ENEMY_SHIELD = {
    // First visual fit around the current enemy sprite.
    // Easy to retune without changing combat semantics.
    scale: 0.36,
} as const;

type GetActorPosition = (actorId: string) => Phaser.Math.Vector2 | undefined;

type EnemyShieldVisual = {
    image: Phaser.GameObjects.Image;

    snapshot?: BridgeEnemyShieldPayload;

    absorbFadeElapsedMs?: number;
};

// Whole-ship enemy shield presentation.
//
// Effects deliberately mirror BridgePlayerShieldView:
// stable alpha, last-second blink, full-alpha absorb flash and short fade.
// No node/sector offsets exist yet; the field follows actor center.
export default class BridgeEnemyShieldView {
    private readonly visuals = new Map<string, EnemyShieldVisual>();

    constructor(
        private readonly scene: BridgeScene,

        private readonly eventBus: BridgeEventBus,

        private readonly getActorPosition: GetActorPosition,
    ) {
        this.eventBus.on(
            BRIDGE_EVENT.ENEMY_SHIELDS_UPDATED,

            this.handleUpdated,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.PLAYER_BEAM_CANNON_FIRED,

            this.handlePlayerBeamCannonFired,
            this,
        );

        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);
    }

    public destroy(): void {
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);

        this.eventBus.off(
            BRIDGE_EVENT.ENEMY_SHIELDS_UPDATED,

            this.handleUpdated,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.PLAYER_BEAM_CANNON_FIRED,

            this.handlePlayerBeamCannonFired,
            this,
        );

        for (const visual of this.visuals.values()) {
            visual.image.destroy();
        }

        this.visuals.clear();
    }

    private handleUpdated(payload: BridgeEnemyShieldsUpdatedPayload): void {
        const activeActorIds = new Set<string>();

        for (const snapshot of payload) {
            activeActorIds.add(snapshot.actorId);

            const visual = this.getOrCreateVisual(snapshot.actorId);

            visual.snapshot = snapshot;

            if (visual.absorbFadeElapsedMs !== undefined) {
                continue;
            }

            visual.image.setVisible(true).setAlpha(getBridgeShieldAlpha(snapshot.remainingDurationMs));
        }

        for (const [actorId, visual] of this.visuals) {
            if (activeActorIds.has(actorId)) {
                continue;
            }

            visual.snapshot = undefined;

            // Same-frame empty snapshot must not cut off absorb flash.
            if (visual.absorbFadeElapsedMs !== undefined) {
                continue;
            }

            this.destroyVisual(actorId);
        }
    }

    private handlePlayerBeamCannonFired(payload: BridgePlayerBeamCannonFiredPayload): void {
        if (payload.outcome !== "absorbed") {
            return;
        }

        const visual = this.getOrCreateVisual(payload.targetActorId);

        visual.snapshot = undefined;

        visual.absorbFadeElapsedMs = 0;

        visual.image.setVisible(true).setAlpha(1);
    }

    private handleSceneUpdate(_time: number, deltaMs: number): void {
        for (const [actorId, visual] of this.visuals) {
            this.updatePosition(actorId, visual);

            if (visual.absorbFadeElapsedMs !== undefined) {
                this.updateAbsorbFade(actorId, visual, deltaMs);

                continue;
            }

            const snapshot = visual.snapshot;

            if (!snapshot) {
                continue;
            }

            visual.image.setAlpha(getBridgeShieldAlpha(snapshot.remainingDurationMs));
        }
    }

    private updatePosition(actorId: string, visual: EnemyShieldVisual): void {
        const position = this.getActorPosition(actorId);

        if (!position) {
            visual.image.setVisible(false);

            return;
        }

        visual.image.setPosition(position.x, position.y).setVisible(true);
    }

    private updateAbsorbFade(actorId: string, visual: EnemyShieldVisual, deltaMs: number): void {
        const elapsedMs = Math.min(
            BRIDGE_SHIELD_PRESENTATION.absorbFadeMs,
            (visual.absorbFadeElapsedMs ?? 0) + deltaMs,
        );

        visual.absorbFadeElapsedMs = elapsedMs;

        const alpha = getBridgeShieldAbsorbFadeAlpha(elapsedMs);

        visual.image.setAlpha(alpha);

        if (alpha > 0) {
            return;
        }

        this.destroyVisual(actorId);
    }

    private getOrCreateVisual(actorId: string): EnemyShieldVisual {
        const existing = this.visuals.get(actorId);

        if (existing) {
            return existing;
        }

        const asset = PLAYER_SHIELD_CENTER_SPRITE;

        const image = this.scene.add
            .image(0, 0, asset.atlasKey, asset.frameKey)
            .setOrigin(0.5, 0.5)
            .setScale(ENEMY_SHIELD.scale)
            .setAlpha(BRIDGE_SHIELD_PRESENTATION.baseAlpha)
            .setVisible(false);

        this.scene.layers.get("vfx").add(image);

        const visual: EnemyShieldVisual = {
            image,
        };

        this.visuals.set(actorId, visual);

        return visual;
    }

    private destroyVisual(actorId: string): void {
        const visual = this.visuals.get(actorId);

        if (!visual) {
            return;
        }

        visual.image.destroy();

        this.visuals.delete(actorId);
    }
}
