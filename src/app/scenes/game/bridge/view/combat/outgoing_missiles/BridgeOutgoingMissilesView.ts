// src/app/scenes/game/bridge/view/combat/outgoing_missiles/BridgeOutgoingMissilesView.ts

import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeOutgoingMissileAddedPayload,
    type BridgeOutgoingMissileRemovedPayload,
    type BridgeOutgoingMissilesUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import {
    getBridgePlayerWeaponSourcePosition,
} from '../bridge_player_weapon_layout';
import {
    removeMissingCombatSnapshotEntries,
} from '../remove_missing_combat_snapshot_entries';
import BridgeOutgoingMissileView from './missile/BridgeOutgoingMissileView';

type GetObjectPosition = (
    objectId: string,
) => Phaser.Math.Vector2 | undefined;

// Manager-view for player missiles.
//
// Target position is captured at launch,
// before a lethal impact can remove the actor.
export default class BridgeOutgoingMissilesView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly missiles =
        new Map<
            string,
            BridgeOutgoingMissileView
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
                .OUTGOING_MISSILE_ADDED,

            this.addMissile,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .OUTGOING_MISSILES_UPDATED,

            this.updateMissiles,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .OUTGOING_MISSILE_REMOVED,

            this.removeMissile,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT
                .OUTGOING_MISSILE_ADDED,

            this.addMissile,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .OUTGOING_MISSILES_UPDATED,

            this.updateMissiles,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .OUTGOING_MISSILE_REMOVED,

            this.removeMissile,
            this,
        );

        for (
            const missile of
            this.missiles.values()
        ) {
            missile.destroy();
        }

        this.missiles.clear();

        this.root.destroy(false);
    }

    public setCameraTurnOffsetX(
        offsetX: number,
    ): void {
        this.root.x = Math.round(
            offsetX,
        );
    }

    private addMissile(
        payload:
            BridgeOutgoingMissileAddedPayload,
    ): void {
        if (
            this.missiles.has(
                payload.projectileId,
            )
        ) {
            throw new Error(
                'Outgoing missile already exists: ' +
                    payload.projectileId,
            );
        }

        const targetPosition =
            this.getObjectPosition(
                payload.targetActorId,
            );

        if (!targetPosition) {
            throw new Error(
                'Outgoing missile target object not found: ' +
                    payload.targetActorId,
            );
        }

        const missile =
            new BridgeOutgoingMissileView({
                scene:
                    this.scene,

                parent:
                    this.root,

                startPosition:
                    getBridgePlayerWeaponSourcePosition(),

                targetPosition,

                initialTimeToImpactMs:
                    payload
                        .initialTimeToImpactMs,
            });

        this.missiles.set(
            payload.projectileId,
            missile,
        );
    }

    private updateMissiles(
        updates:
            BridgeOutgoingMissilesUpdatedPayload,
    ): void {
        removeMissingCombatSnapshotEntries(
            this.missiles,
            updates.map((update) => {
                return update.projectileId;
            }),
            (projectileId, missile) => {
                missile.destroy();
                this.missiles.delete(
                    projectileId,
                );
            },
        );

        if (updates.length === 0) {
            this.setCameraTurnOffsetX(0);
        }

        for (const update of updates) {
            const missile =
                this.missiles.get(
                    update.projectileId,
                );

            if (!missile) {
                throw new Error(
                    'Outgoing missile not found during update: ' +
                        update.projectileId,
                );
            }

            missile.update(
                update.timeToImpactMs,
            );
        }
    }

    private removeMissile(
        payload:
            BridgeOutgoingMissileRemovedPayload,
    ): void {
        const missile =
            this.missiles.get(
                payload.projectileId,
            );

        if (!missile) {
            throw new Error(
                'Outgoing missile not found: ' +
                    payload.projectileId,
            );
        }

        // Outcome-specific impact VFX
        // is deferred until the flight read is verified.
        missile.destroy();

        this.missiles.delete(
            payload.projectileId,
        );
    }
}
