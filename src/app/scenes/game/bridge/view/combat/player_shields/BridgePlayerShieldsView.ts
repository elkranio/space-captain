// src/app/scenes/game/bridge/view/combat/player_shields/BridgePlayerShieldsView.ts

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
    type BridgeLaserBeamFiredPayload,
    type BridgePlayerShieldUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import {
    BRIDGE_VIEWSCREEN_RECT,
} from '../../bridge_viewscreen_layout';
import BridgeShieldFieldView from '../shields/BridgeShieldFieldView';

const PLAYER_SHIELD_LAYOUT = {
    y:
        BRIDGE_VIEWSCREEN_RECT.y +
        BRIDGE_VIEWSCREEN_RECT.height /
            2,

    [LASER_TARGET_ZONE.LEFT]: {
        x:
            BRIDGE_VIEWSCREEN_RECT.x +
            163,
    },

    [LASER_TARGET_ZONE.CENTER]: {
        x:
            BRIDGE_VIEWSCREEN_RECT.x +
            BRIDGE_VIEWSCREEN_RECT
                .width /
                2,
    },

    [LASER_TARGET_ZONE.RIGHT]: {
        x:
            BRIDGE_VIEWSCREEN_RECT.x +
            BRIDGE_VIEWSCREEN_RECT
                .width -
            162,
    },
} as const;

// Player wrapper around the shared directional shield-field VFX.
//
// Engine snapshot remains authoritative for zone/lifetime.
// LASER_BEAM_FIRED starts the local blocked-impact flash.
export default class BridgePlayerShieldsView {
    private readonly root:
        Phaser.GameObjects.Container;

    private field?:
        BridgeShieldFieldView;

    constructor(
        private readonly scene:
            BridgeScene,

        private readonly eventBus:
            BridgeEventBus,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        this.scene.layers
            .get('space')
            .add(this.root);

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_SHIELD_UPDATED,

            this.updateShield,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .LASER_BEAM_FIRED,

            this.handleLaserBeamFired,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_SHIELD_UPDATED,

            this.updateShield,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .LASER_BEAM_FIRED,

            this.handleLaserBeamFired,
            this,
        );

        this.clearShield();

        this.root.destroy(false);
    }

    private updateShield(
        payload:
            BridgePlayerShieldUpdatedPayload,
    ): void {
        if (!payload) {
            // Engine already consumed the matching field,
            // but the local impact fade must finish.
            if (
                this.field
                    ?.isImpactPlaying()
            ) {
                return;
            }

            this.clearShield();
            return;
        }

        if (
            !this.field ||
            this.field.getZone() !==
                payload.zone ||
            this.field
                .isImpactPlaying()
        ) {
            this.clearShield();

            this.field =
                this.createShield(
                    payload,
                );
        } else {
            this.field
                .syncLifetime(
                    payload
                        .remainingDurationMs,

                    payload
                        .initialDurationMs,
                );
        }
    }

    private handleLaserBeamFired(
        payload:
            BridgeLaserBeamFiredPayload,
    ): void {
        if (
            payload.outcome !==
            LASER_SHOT_OUTCOME.BLOCKED
        ) {
            return;
        }

        const field =
            this.field;

        if (!field) {
            throw new Error(
                'Blocked laser has no ' +
                    'displayed player shield: ' +
                    payload.targetZone,
            );
        }

        if (
            field.getZone() !==
            payload.targetZone
        ) {
            throw new Error(
                'Blocked laser zone does ' +
                    'not match displayed ' +
                    'player shield: ' +
                    payload.targetZone +
                    '/' +
                    field.getZone(),
            );
        }

        field.playImpact();
    }

    private createShield(
        payload:
            Exclude<
                BridgePlayerShieldUpdatedPayload,
                undefined
            >,
    ): BridgeShieldFieldView {
        return new BridgeShieldFieldView({
            scene:
                this.scene,

            parent:
                this.root,

            zone:
                payload.zone,

            position:
                this.getShieldPosition(
                    payload.zone,
                ),

            scale: 1,

            remainingDurationMs:
                payload
                    .remainingDurationMs,

            initialDurationMs:
                payload
                    .initialDurationMs,

            onImpactComplete:
                (completedField) => {
                    if (
                        this.field !==
                        completedField
                    ) {
                        return;
                    }

                    this.clearShield();
                },
        });
    }

    private clearShield(): void {
        this.field?.destroy();

        this.field = undefined;
    }

    private getShieldPosition(
        zone:
            LaserTargetZone,
    ): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(
            PLAYER_SHIELD_LAYOUT[
                zone
            ].x,

            PLAYER_SHIELD_LAYOUT.y,
        );
    }
}
