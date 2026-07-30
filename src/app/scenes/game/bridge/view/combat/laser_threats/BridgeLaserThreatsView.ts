// src/app/scenes/game/bridge/view/combat/laser_threats/BridgeLaserThreatsView.ts

import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeLaserThreatAddedPayload,
    type BridgeLaserThreatRemovedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import BridgeLaserThreatView from './laser/BridgeLaserThreatView';

type GetObjectPosition = (objectId: string) => Phaser.Math.Vector2 | undefined;

// Manager-view активных laser charging threats.
//
// Отвечает только за:
// - bridge events;
// - поиск origin source actor;
// - lifecycle laser threat views.
export default class BridgeLaserThreatsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly threats = new Map<string, BridgeLaserThreatView>();

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        private readonly getObjectPosition: GetObjectPosition,
    ) {
        this.root = this.scene.add.container(0, 0);

        // Поверх encounter objects,
        // но под bridge interior и UI.
        this.scene.layers.get('vfx').add(this.root);

        this.eventBus.on(
            BRIDGE_EVENT.LASER_THREAT_ADDED,
            this.addThreat,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.LASER_THREAT_REMOVED,
            this.removeThreat,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.LASER_THREAT_ADDED,
            this.addThreat,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.LASER_THREAT_REMOVED,
            this.removeThreat,
            this,
        );

        for (const threat of this.threats.values()) {
            threat.destroy();
        }

        this.threats.clear();
        this.root.destroy(false);
    }

    private addThreat(payload: BridgeLaserThreatAddedPayload): void {
        if (this.threats.has(payload.attackId)) {
            throw new Error(
                `Laser threat already exists: ${payload.attackId}`,
            );
        }

        const weaponOrigin = this.getObjectPosition(payload.sourceActorId);

        if (!weaponOrigin) {
            throw new Error(
                `Laser threat source object not found: ${payload.sourceActorId}`,
            );
        }

        const threat = new BridgeLaserThreatView({
            scene: this.scene,
            parent: this.root,

            designation: payload.designation,

            weaponOrigin,
        });

        this.threats.set(payload.attackId, threat);
    }

    private removeThreat(payload: BridgeLaserThreatRemovedPayload): void {
        const threat = this.threats.get(payload.attackId);

        if (!threat) {
            throw new Error(
                `Laser threat not found: ${payload.attackId}`,
            );
        }

        threat.destroy();

        this.threats.delete(payload.attackId);
    }
}
