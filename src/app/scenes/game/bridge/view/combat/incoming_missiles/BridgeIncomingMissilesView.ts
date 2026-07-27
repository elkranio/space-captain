// src/app/scenes/game/bridge/view/combat/incoming_missiles/BridgeIncomingMissilesView.ts

import { MISSILE_SPRITE_ID, MISSILE_SPRITES } from '../../../../../../manifests/combat/missiles/missile_sprite';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeIncomingMissileAddedPayload,
    type BridgeIncomingMissileRemovedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';

const INCOMING_MISSILE_PRESENTATION = {
    // Нижняя часть viewscreen, как в проверочном мокапе.
    y: 350,

    maxScale: 1,

    // Базовый asset смотрит направо.
    // Incoming presentation показывает его как в мокапе —
    // носом влево и слегка к игроку.
    flipX: true,
} as const;

// Presentation летящих в игрока ракет.
//
// Engine хранит projectile state и определяет impact.
// Эта view только создаёт и удаляет Phaser images.
export default class BridgeIncomingMissilesView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly missileImages = new Map<string, Phaser.GameObjects.Image>();

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);

        // Transient combat objects находятся:
        // - поверх space encounter objects;
        // - под bridge interior и UI.
        this.scene.layers.get('vfx').add(this.root);

        this.eventBus.on(BRIDGE_EVENT.INCOMING_MISSILE_ADDED, this.addMissile, this);

        this.eventBus.on(BRIDGE_EVENT.INCOMING_MISSILE_REMOVED, this.removeMissile, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.INCOMING_MISSILE_ADDED, this.addMissile, this);

        this.eventBus.off(BRIDGE_EVENT.INCOMING_MISSILE_REMOVED, this.removeMissile, this);

        this.missileImages.clear();
        this.root.destroy(true);
    }

    private addMissile(payload: BridgeIncomingMissileAddedPayload): void {
        if (this.missileImages.has(payload.projectileId)) {
            throw new Error(`Incoming missile already exists: ${payload.projectileId}`);
        }

        const sprite = MISSILE_SPRITES[MISSILE_SPRITE_ID.GENERIC_00];

        const image = this.scene.add
            .image(
                this.scene.scale.width / 2,
                INCOMING_MISSILE_PRESENTATION.y,

                sprite.atlasKey,
                sprite.frameKey,
            )
            .setScale(INCOMING_MISSILE_PRESENTATION.maxScale)
            .setFlipX(INCOMING_MISSILE_PRESENTATION.flipX);

        this.root.add(image);

        this.missileImages.set(payload.projectileId, image);
    }

    private removeMissile(payload: BridgeIncomingMissileRemovedPayload): void {
        const image = this.missileImages.get(payload.projectileId);

        if (!image) {
            throw new Error(`Incoming missile not found: ${payload.projectileId}`);
        }

        image.destroy();

        this.missileImages.delete(payload.projectileId);
    }
}
