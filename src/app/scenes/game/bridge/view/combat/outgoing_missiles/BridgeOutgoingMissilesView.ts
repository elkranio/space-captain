// src/app/scenes/game/bridge/view/combat/outgoing_missiles/BridgeOutgoingMissilesView.ts

import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeEnemyPointDefenseFiredPayload,
    type BridgeOutgoingMissileAddedPayload,
    type BridgeOutgoingMissileRemovedPayload,
    type BridgeOutgoingMissilesUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import {
    getBridgePlayerWeaponSourcePosition,
} from '../bridge_player_weapon_layout';
import BridgePointDefenseBeamView from '../point_defense/BridgePointDefenseBeamView';
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
//
// Enemy point-defense:
// - ENEMY_POINT_DEFENSE_FIRED arrives while the missile still exists;
// - the beam captures that last displayed missile position;
// - a following OUTGOING_MISSILE_REMOVED event removes the sprite on HIT;
// - MISS has no removal event, so the missile continues its flight.
export default class BridgeOutgoingMissilesView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly missiles =
        new Map<
            string,
            BridgeOutgoingMissileView
        >();

    private readonly pointDefenseEffects =
        new Set<
            BridgePointDefenseBeamView
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

        this.eventBus.on(
            BRIDGE_EVENT
                .ENEMY_POINT_DEFENSE_FIRED,

            this.handleEnemyPointDefenseFired,
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

        this.eventBus.off(
            BRIDGE_EVENT
                .ENEMY_POINT_DEFENSE_FIRED,

            this.handleEnemyPointDefenseFired,
            this,
        );

        for (
            const effect of
            this.pointDefenseEffects
        ) {
            effect.destroy();
        }

        this.pointDefenseEffects.clear();

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

        missile.destroy();

        this.missiles.delete(
            payload.projectileId,
        );
    }

    private handleEnemyPointDefenseFired(
        payload:
            BridgeEnemyPointDefenseFiredPayload,
    ): void {
        const missile =
            this.missiles.get(
                payload.projectileId,
            );

        if (!missile) {
            throw new Error(
                'Enemy point-defense target not found: ' +
                    payload.projectileId,
            );
        }

        const sourcePosition =
            this.getObjectPosition(
                payload.sourceActorId,
            );

        if (!sourcePosition) {
            throw new Error(
                'Enemy point-defense source object not found: ' +
                    payload.sourceActorId,
            );
        }

        const effect =
            new BridgePointDefenseBeamView({
                scene:
                    this.scene,

                parent:
                    this.root,

                beamBand:
                    payload.beamBand,

                outcome:
                    payload.outcome,

                sourcePosition,

                // Last position actually displayed before a possible
                // interception resolution removes the missile sprite.
                targetPosition:
                    missile.getPosition(),

                onComplete:
                    (completedEffect) => {
                        this.pointDefenseEffects
                            .delete(
                                completedEffect,
                            );
                    },
            });

        this.pointDefenseEffects.add(
            effect,
        );
    }
}
