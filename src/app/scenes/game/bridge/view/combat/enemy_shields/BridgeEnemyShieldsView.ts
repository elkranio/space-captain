// src/app/scenes/game/bridge/view/combat/enemy_shields/BridgeEnemyShieldsView.ts

import {
    LASER_TARGET_ZONE,
    type LaserTargetZone,
} from '../../../../../../../engine/defs/laser';
import {
    LASER_SHOT_OUTCOME,
} from '../../../../../../../engine/encounter/model/combat';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeEnemyShieldsUpdatedPayload,
    type BridgePlayerLaserFiredPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import BridgeShieldFieldView from '../shields/BridgeShieldFieldView';

type GetObjectPosition = (
    objectId: string,
) => Phaser.Math.Vector2 | undefined;

type EnemyShieldEntry = {
    zone:
        LaserTargetZone;

    field:
        BridgeShieldFieldView;
};

// Temporary geometry for the current 3/4 enemy ship.
//
// The forthcoming front-facing ship art should only require changing
// this scale/offset table, not shield events or lifecycle.
const ENEMY_SHIELD_LAYOUT = {
    scale: 0.24,

    yOffset: 0,

    [LASER_TARGET_ZONE.LEFT]: {
        xOffset: -24,
    },

    [LASER_TARGET_ZONE.CENTER]: {
        xOffset: 0,
    },

    [LASER_TARGET_ZONE.RIGHT]: {
        xOffset: 24,
    },
} as const;

// Presentation manager for active enemy directional shield fields.
//
// Snapshot owns active zone and remaining lifetime.
// PLAYER_LASER_FIRED owns the local blocked-impact flash.
// A following empty snapshot cannot remove a field while its impact
// flash/fade is still playing.
export default class BridgeEnemyShieldsView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly shields =
        new Map<
            string,
            EnemyShieldEntry
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

        // BridgeSpaceView has already added encounter objects.
        // Enemy shield fields therefore sit over actor sprites,
        // but remain under laser VFX and bridge interior.
        this.scene.layers
            .get('space')
            .add(this.root);

        this.eventBus.on(
            BRIDGE_EVENT
                .ENEMY_SHIELDS_UPDATED,

            this.updateShields,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_LASER_FIRED,

            this.handlePlayerLaserFired,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT
                .ENEMY_SHIELDS_UPDATED,

            this.updateShields,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_LASER_FIRED,

            this.handlePlayerLaserFired,
            this,
        );

        for (
            const actorId of
            this.shields.keys()
        ) {
            this.removeShield(
                actorId,
            );
        }

        this.root.destroy(false);
    }

    public setCameraTurnOffsetX(
        offsetX: number,
    ): void {
        this.root.x =
            Math.round(offsetX);
    }

    private updateShields(
        snapshots:
            BridgeEnemyShieldsUpdatedPayload,
    ): void {
        const receivedActorIds =
            new Set<string>();

        for (
            const snapshot of
            snapshots
        ) {
            if (
                receivedActorIds.has(
                    snapshot.actorId,
                )
            ) {
                throw new Error(
                    'Duplicate enemy shield snapshot: ' +
                        snapshot.actorId,
                );
            }

            receivedActorIds.add(
                snapshot.actorId,
            );

            const actorPosition =
                this.getObjectPosition(
                    snapshot.actorId,
                );

            if (!actorPosition) {
                throw new Error(
                    'Enemy shield actor object ' +
                        'not found: ' +
                        snapshot.actorId,
                );
            }

            let entry =
                this.shields.get(
                    snapshot.actorId,
                );

            if (
                !entry ||
                entry.zone !==
                    snapshot.zone ||
                entry.field
                    .isImpactPlaying()
            ) {
                this.removeShield(
                    snapshot.actorId,
                );

                entry =
                    this.createShield(
                        snapshot.actorId,
                        snapshot.zone,
                        actorPosition,

                        snapshot
                            .remainingDurationMs,

                        snapshot
                            .initialDurationMs,
                    );
            } else {
                entry.field
                    .setPosition(
                        this.getShieldPosition(
                            actorPosition,
                            snapshot.zone,
                        ),
                    );

                entry.field
                    .syncLifetime(
                        snapshot
                            .remainingDurationMs,

                        snapshot
                            .initialDurationMs,
                    );
            }
        }

        for (
            const [
                actorId,
                entry,
            ] of this.shields
        ) {
            if (
                receivedActorIds.has(
                    actorId,
                ) ||
                entry.field
                    .isImpactPlaying()
            ) {
                continue;
            }

            this.removeShield(
                actorId,
            );
        }
    }

    private handlePlayerLaserFired(
        payload:
            BridgePlayerLaserFiredPayload,
    ): void {
        if (
            payload.outcome !==
            LASER_SHOT_OUTCOME.BLOCKED
        ) {
            return;
        }

        const entry =
            this.shields.get(
                payload.targetActorId,
            );

        if (!entry) {
            throw new Error(
                'Blocked player laser has no ' +
                    'displayed enemy shield: ' +
                    payload.targetActorId +
                    '/' +
                    payload.targetZone,
            );
        }

        if (
            entry.zone !==
            payload.targetZone
        ) {
            throw new Error(
                'Blocked player laser zone ' +
                    'does not match displayed ' +
                    'enemy shield: ' +
                    payload.targetActorId +
                    '/' +
                    payload.targetZone +
                    '/' +
                    entry.zone,
            );
        }

        entry.field.playImpact();
    }

    private createShield(
        actorId: string,
        zone: LaserTargetZone,

        actorPosition:
            Phaser.Math.Vector2,

        remainingDurationMs: number,
        initialDurationMs: number,
    ): EnemyShieldEntry {
        const field =
            new BridgeShieldFieldView({
                scene:
                    this.scene,

                parent:
                    this.root,

                zone,

                position:
                    this.getShieldPosition(
                        actorPosition,
                        zone,
                    ),

                scale:
                    ENEMY_SHIELD_LAYOUT
                        .scale,

                remainingDurationMs,
                initialDurationMs,

                onImpactComplete:
                    (completedField) => {
                        const current =
                            this.shields.get(
                                actorId,
                            );

                        if (
                            current?.field !==
                            completedField
                        ) {
                            return;
                        }

                        this.removeShield(
                            actorId,
                        );
                    },
            });

        const entry = {
            zone,
            field,
        };

        this.shields.set(
            actorId,
            entry,
        );

        return entry;
    }

    private removeShield(
        actorId: string,
    ): void {
        const entry =
            this.shields.get(
                actorId,
            );

        if (!entry) {
            return;
        }

        entry.field.destroy();

        this.shields.delete(
            actorId,
        );
    }

    private getShieldPosition(
        actorPosition:
            Phaser.Math.Vector2,

        zone:
            LaserTargetZone,
    ): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(
            Math.round(
                actorPosition.x +
                    ENEMY_SHIELD_LAYOUT[
                        zone
                    ].xOffset,
            ),

            Math.round(
                actorPosition.y +
                    ENEMY_SHIELD_LAYOUT
                        .yOffset,
            ),
        );
    }
}
