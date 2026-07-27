// src/app/scenes/game/bridge/view/combat/incoming_missiles/BridgeIncomingMissilesView.ts

import { MISSILE_SPRITE_ID, MISSILE_SPRITES } from '../../../../../../manifests/combat/missiles/missile_sprite';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeIncomingMissileAddedPayload,
    type BridgeIncomingMissileRemovedPayload,
    type BridgeIncomingMissilesUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { BRIDGE_VIEWSCREEN_RECT } from '../../bridge_viewscreen_layout';

type GetObjectPosition = (objectId: string) => Phaser.Math.Vector2 | undefined;

type IncomingMissileViewState = {
    image: Phaser.GameObjects.Image;

    startPosition: Phaser.Math.Vector2;
    controlPosition: Phaser.Math.Vector2;
    targetPosition: Phaser.Math.Vector2;

    initialTimeToImpactMs: number;
};

const INCOMING_MISSILE_PRESENTATION = {
    minScale: 0.12,
    maxScale: 1,

    // Presentation двигается дискретными шагами,
    // но authoritative engine time остаётся плавным.
    framesPerSecond: 12,

    impactInsetX: 260,

    // Финальная точка находится уже под viewscreen.
    // Bridge interior естественно перекрывает ракету.
    impactOffsetBelowViewscreenMin: 25,
    impactOffsetBelowViewscreenMax: 55,

    controlDriftX: 60,
    controlDriftY: 30,
} as const;

// Presentation летящих в игрока ракет.
//
// Engine является источником progress:
// view только интерполирует положение и масштаб
// между полученными projectile snapshots.
export default class BridgeIncomingMissilesView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly missiles = new Map<string, IncomingMissileViewState>();

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        private readonly getObjectPosition: GetObjectPosition,
    ) {
        this.root = this.scene.add.container(0, 0);

        // Поверх encounter objects,
        // но под bridge interior и UI.
        this.scene.layers.get('vfx').add(this.root);

        this.eventBus.on(BRIDGE_EVENT.INCOMING_MISSILE_ADDED, this.addMissile, this);

        this.eventBus.on(BRIDGE_EVENT.INCOMING_MISSILES_UPDATED, this.updateMissiles, this);

        this.eventBus.on(BRIDGE_EVENT.INCOMING_MISSILE_REMOVED, this.removeMissile, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.INCOMING_MISSILE_ADDED, this.addMissile, this);

        this.eventBus.off(BRIDGE_EVENT.INCOMING_MISSILES_UPDATED, this.updateMissiles, this);

        this.eventBus.off(BRIDGE_EVENT.INCOMING_MISSILE_REMOVED, this.removeMissile, this);

        this.missiles.clear();
        this.root.destroy(true);
    }

    private addMissile(payload: BridgeIncomingMissileAddedPayload): void {
        if (this.missiles.has(payload.projectileId)) {
            throw new Error(`Incoming missile already exists: ` + payload.projectileId);
        }

        const startPosition = this.getObjectPosition(payload.sourceActorId);

        if (!startPosition) {
            throw new Error(`Incoming missile source object not found: ` + payload.sourceActorId);
        }

        const targetPosition = this.createImpactPosition();

        const controlPosition = this.createControlPosition(startPosition, targetPosition);

        const sprite = MISSILE_SPRITES[MISSILE_SPRITE_ID.GENERIC_00];

        const image = this.scene.add
            .image(
                startPosition.x,
                startPosition.y,

                sprite.atlasKey,
                sprite.frameKey,
            )
            .setScale(INCOMING_MISSILE_PRESENTATION.minScale)
            .setFlipX(targetPosition.x < startPosition.x);

        this.root.add(image);

        this.missiles.set(payload.projectileId, {
            image,

            startPosition,
            controlPosition,
            targetPosition,

            initialTimeToImpactMs: payload.initialTimeToImpactMs,
        });
    }

    private updateMissiles(updates: BridgeIncomingMissilesUpdatedPayload): void {
        for (const update of updates) {
            const missile = this.missiles.get(update.projectileId);

            if (!missile) {
                throw new Error(`Incoming missile not found during update: ` + update.projectileId);
            }

            const progress = this.getQuantizedProgress(missile.initialTimeToImpactMs, update.timeToImpactMs);

            const position = this.getQuadraticBezierPosition(
                missile.startPosition,
                missile.controlPosition,
                missile.targetPosition,
                progress,
            );

            // Масштаб растёт медленнее в начале
            // и резко ближе к impact.
            const scaleProgress = progress * progress;

            const scale = Phaser.Math.Linear(
                INCOMING_MISSILE_PRESENTATION.minScale,
                INCOMING_MISSILE_PRESENTATION.maxScale,
                scaleProgress,
            );

            missile.image.setPosition(position.x, position.y).setScale(scale);
        }
    }

    private removeMissile(payload: BridgeIncomingMissileRemovedPayload): void {
        const missile = this.missiles.get(payload.projectileId);

        if (!missile) {
            throw new Error(`Incoming missile not found: ` + payload.projectileId);
        }

        missile.image.destroy();

        this.missiles.delete(payload.projectileId);
    }

    private getQuantizedProgress(initialTimeToImpactMs: number, timeToImpactMs: number): number {
        const elapsedMs = initialTimeToImpactMs - timeToImpactMs;

        const frameDurationMs = 1000 / INCOMING_MISSILE_PRESENTATION.framesPerSecond;

        const quantizedElapsedMs = Math.floor(elapsedMs / frameDurationMs) * frameDurationMs;

        return Phaser.Math.Clamp(
            quantizedElapsedMs / initialTimeToImpactMs,

            0,
            1,
        );
    }

    private createImpactPosition(): Phaser.Math.Vector2 {
        const viewscreenBottom = BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height;

        return new Phaser.Math.Vector2(
            Phaser.Math.Between(
                BRIDGE_VIEWSCREEN_RECT.x + INCOMING_MISSILE_PRESENTATION.impactInsetX,

                BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width - INCOMING_MISSILE_PRESENTATION.impactInsetX,
            ),

            Phaser.Math.Between(
                viewscreenBottom + INCOMING_MISSILE_PRESENTATION.impactOffsetBelowViewscreenMin,

                viewscreenBottom + INCOMING_MISSILE_PRESENTATION.impactOffsetBelowViewscreenMax,
            ),
        );
    }

    private createControlPosition(start: Phaser.Math.Vector2, target: Phaser.Math.Vector2): Phaser.Math.Vector2 {
        const midpoint = start.clone().lerp(target, 0.5);

        midpoint.x += Phaser.Math.Between(
            -INCOMING_MISSILE_PRESENTATION.controlDriftX,

            INCOMING_MISSILE_PRESENTATION.controlDriftX,
        );

        midpoint.y += Phaser.Math.Between(
            -INCOMING_MISSILE_PRESENTATION.controlDriftY,

            INCOMING_MISSILE_PRESENTATION.controlDriftY,
        );

        return midpoint;
    }

    private getQuadraticBezierPosition(
        start: Phaser.Math.Vector2,
        control: Phaser.Math.Vector2,
        target: Phaser.Math.Vector2,
        progress: number,
    ): Phaser.Math.Vector2 {
        const inverseProgress = 1 - progress;

        const startWeight = inverseProgress * inverseProgress;

        const controlWeight = 2 * inverseProgress * progress;

        const targetWeight = progress * progress;

        return new Phaser.Math.Vector2(
            startWeight * start.x + controlWeight * control.x + targetWeight * target.x,

            startWeight * start.y + controlWeight * control.y + targetWeight * target.y,
        );
    }
}
