// src/app/scenes/game/bridge/view/combat/enemy_destruction/BridgeEnemyShipDestructionView.ts

import type BridgeScene from "../../../BridgeScene";
import { BRIDGE_EVENT, type BridgeEnemyShipDestructionPayload } from "../../../events/bridge_event";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import BridgeEnemyShipExplosionView from "./explosion/BridgeEnemyShipExplosionView";

type GetObjectPosition = (objectId: string) => Phaser.Math.Vector2 | undefined;

// Manager-view уничтожения enemy ships.
//
// На STARTED ещё существует object view,
// поэтому позиция фиксируется до его удаления.
export default class BridgeEnemyShipDestructionView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly explosions = new Map<string, BridgeEnemyShipExplosionView>();

    constructor(
        private readonly scene: BridgeScene,

        private readonly eventBus: BridgeEventBus,

        private readonly getObjectPosition: GetObjectPosition,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.scene.layers.get("vfx").add(this.root);

        this.eventBus.on(
            BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_STARTED,

            this.startDestruction,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_STARTED,

            this.startDestruction,
            this,
        );

        for (const explosion of this.explosions.values()) {
            explosion.destroy();
        }

        this.explosions.clear();
        this.root.destroy(false);
    }

    private startDestruction(payload: BridgeEnemyShipDestructionPayload): void {
        if (this.explosions.has(payload.actorId)) {
            throw new Error("Enemy ship destruction " + "already displayed: " + payload.actorId);
        }

        const position = this.getObjectPosition(payload.actorId);

        if (!position) {
            throw new Error("Enemy ship destruction " + "object not found: " + payload.actorId);
        }

        const explosion = new BridgeEnemyShipExplosionView({
            scene: this.scene,

            parent: this.root,

            position,

            onComplete: () => {
                explosion.destroy();

                this.explosions.delete(payload.actorId);

                this.eventBus.emit(
                    BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_COMPLETED,

                    {
                        actorId: payload.actorId,
                    },
                );
            },
        });

        this.explosions.set(payload.actorId, explosion);
    }
}
