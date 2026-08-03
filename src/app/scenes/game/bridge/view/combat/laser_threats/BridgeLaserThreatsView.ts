// src/app/scenes/game/bridge/view/combat/laser_threats/BridgeLaserThreatsView.ts

import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeEnemyShipDestructionPayload,
    type BridgeLaserThreatAddedPayload,
    type BridgeLaserThreatRemovedPayload,
    type BridgeLaserThreatsUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import {
    removeMissingCombatSnapshotEntries,
} from '../remove_missing_combat_snapshot_entries';
import BridgeLaserThreatView from './laser/BridgeLaserThreatView';

type GetObjectPosition = (
    objectId: string,
) => Phaser.Math.Vector2 | undefined;

// Manager-view активных laser charging threats.
export default class BridgeLaserThreatsView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly threats =
        new Map<
            string,
            BridgeLaserThreatView
        >();

    constructor(
        private readonly scene:
            BridgeScene,

        private readonly eventBus:
            BridgeEventBus,

        private readonly getObjectPosition:
            GetObjectPosition,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        this.scene.layers
            .get('vfx')
            .add(this.root);

        this.eventBus.on(
            BRIDGE_EVENT
                .LASER_THREAT_ADDED,

            this.addThreat,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .LASER_THREAT_REMOVED,

            this.removeThreat,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .LASER_THREATS_UPDATED,

            this.updateThreats,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .ENEMY_SHIP_DESTRUCTION_STARTED,

            this.handleEnemyShipDestruction,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT
                .LASER_THREAT_ADDED,

            this.addThreat,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .LASER_THREAT_REMOVED,

            this.removeThreat,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .LASER_THREATS_UPDATED,

            this.updateThreats,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .ENEMY_SHIP_DESTRUCTION_STARTED,

            this.handleEnemyShipDestruction,
            this,
        );

        this.clearThreats();
        this.root.destroy(false);
    }

    public setCameraTurnOffsetX(
        offsetX: number,
    ): void {
        this.root.x = Math.round(
            offsetX,
        );
    }

    private addThreat(
        payload:
            BridgeLaserThreatAddedPayload,
    ): void {
        if (
            this.threats.has(
                payload.attackId,
            )
        ) {
            throw new Error(
                'Laser threat already ' +
                    'exists: ' +
                    payload.attackId,
            );
        }

        const weaponOrigin =
            this.getObjectPosition(
                payload.sourceActorId,
            );

        if (!weaponOrigin) {
            throw new Error(
                'Laser threat source ' +
                    'object not found: ' +
                    payload.sourceActorId,
            );
        }

        const threat =
            new BridgeLaserThreatView({
                scene:
                    this.scene,

                parent:
                    this.root,

                designation:
                    payload.designation,

                weaponOrigin,
            });

        this.threats.set(
            payload.attackId,
            threat,
        );
    }

    private removeThreat(
        payload:
            BridgeLaserThreatRemovedPayload,
    ): void {
        const threat =
            this.threats.get(
                payload.attackId,
            );

        if (!threat) {
            throw new Error(
                'Laser threat not found: ' +
                    payload.attackId,
            );
        }

        threat.destroy();

        this.threats.delete(
            payload.attackId,
        );
    }

    private updateThreats(
        payload:
            BridgeLaserThreatsUpdatedPayload,
    ): void {
        removeMissingCombatSnapshotEntries(
            this.threats,
            payload.map((update) => {
                return update.attackId;
            }),
            (attackId, threat) => {
                threat.destroy();
                this.threats.delete(
                    attackId,
                );
            },
        );

        if (payload.length === 0) {
            this.setCameraTurnOffsetX(0);
        }

        for (const update of payload) {
            const threat =
                this.threats.get(
                    update.attackId,
                );

            if (!threat) {
                throw new Error(
                    'Laser threat update ' +
                        'target not found: ' +
                        update.attackId,
                );
            }

            threat.update(
                update.timeToFireMs,

                update
                    .initialTimeToFireMs,

                update.targetZone,
            );
        }
    }

    private handleEnemyShipDestruction(
        _payload:
            BridgeEnemyShipDestructionPayload,
    ): void {
        // В текущем combat slice
        // существует один hostile ship.
        this.clearThreats();
    }

    private clearThreats(): void {
        for (
            const threat of
            this.threats.values()
        ) {
            threat.destroy();
        }

        this.threats.clear();
    }
}
