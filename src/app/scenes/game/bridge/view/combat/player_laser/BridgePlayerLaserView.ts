// src/app/scenes/game/bridge/view/combat/player_laser/BridgePlayerLaserView.ts

import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgePlayerLaserChargingClearedPayload,
    type BridgePlayerLaserChargingStartedPayload,
    type BridgePlayerLaserFiredPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import {
    getBridgePlayerWeaponSourcePosition,
} from '../bridge_player_weapon_layout';
import BridgeLaserBeamView from '../laser_beams/beam/BridgeLaserBeamView';
import BridgeLaserChargeView from '../laser_charge/BridgeLaserChargeView';
import BridgePlayerLaserImpactView from './impact/BridgePlayerLaserImpactView';

type GetObjectPosition = (
    objectId: string,
) => Phaser.Math.Vector2 | undefined;

// Temporary player weapon presentation.
//
// Baseline player laser now fires at the visual center of the
// target actor. Node-specific impact positions return together
// with the future targeting-node contract.
export default class BridgePlayerLaserView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly mount:
        Phaser.GameObjects.Graphics;

    private readonly beams =
        new Set<BridgeLaserBeamView>();

    private readonly impacts =
        new Set<BridgePlayerLaserImpactView>();

    private chargeView?:
        BridgeLaserChargeView;

    private chargingWeaponId?:
        string;

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

        this.mount =
            this.scene.add.graphics();

        this.root.add(this.mount);

        this.drawMount();

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_LASER_CHARGING_STARTED,

            this.startCharging,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_LASER_CHARGING_CLEARED,

            this.clearCharging,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_LASER_FIRED,

            this.fire,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_LASER_CHARGING_STARTED,

            this.startCharging,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_LASER_CHARGING_CLEARED,

            this.clearCharging,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_LASER_FIRED,

            this.fire,
            this,
        );

        this.chargeView?.destroy();

        for (const beam of this.beams) {
            beam.destroy();
        }

        for (
            const impact of
            this.impacts
        ) {
            impact.destroy();
        }

        this.beams.clear();
        this.impacts.clear();

        this.root.destroy(true);

        this.chargeView =
            undefined;

        this.chargingWeaponId =
            undefined;
    }

    private startCharging(
        payload:
            BridgePlayerLaserChargingStartedPayload,
    ): void {
        this.chargeView?.destroy();

        this.chargingWeaponId =
            payload.weaponId;

        this.chargeView =
            BridgeLaserChargeView.create({
                scene:
                    this.scene,

                parent:
                    this.root,

                position:
                    this.getSourcePosition(),
            });
    }

    private clearCharging(
        payload:
            BridgePlayerLaserChargingClearedPayload,
    ): void {
        if (
            this.chargingWeaponId !==
            payload.weaponId
        ) {
            return;
        }

        this.chargeView?.destroy();

        this.chargeView =
            undefined;

        this.chargingWeaponId =
            undefined;
    }

    private fire(
        payload:
            BridgePlayerLaserFiredPayload,
    ): void {
        this.clearCharging({
            weaponId:
                payload.weaponId,
        });

        const targetOrigin =
            this.getObjectPosition(
                payload.targetActorId,
            );

        if (!targetOrigin) {
            throw new Error(
                'Player laser target ' +
                    'object not found: ' +
                    payload.targetActorId,
            );
        }

        const sourcePosition =
            this.getSourcePosition();

        const targetPosition =
            new Phaser.Math.Vector2(
                Math.round(
                    targetOrigin.x,
                ),

                Math.round(
                    targetOrigin.y,
                ),
            );

        const beam =
            new BridgeLaserBeamView({
                scene:
                    this.scene,

                parent:
                    this.root,

                sourcePosition,
                targetPosition,

                sourceNear: true,

                onComplete: () => {
                    beam.destroy();

                    this.beams.delete(
                        beam,
                    );
                },
            });

        this.beams.add(beam);

        const impact =
            new BridgePlayerLaserImpactView({
                scene:
                    this.scene,

                parent:
                    this.root,

                position:
                    targetPosition,

                // Baseline player laser has no shield interception.
                blocked: false,

                onComplete: () => {
                    impact.destroy();

                    this.impacts.delete(
                        impact,
                    );
                },
            });

        this.impacts.add(impact);
    }

    private drawMount(): void {
        const source =
            this.getSourcePosition();

        this.mount.clear();

        // Outline/base.
        this.mount.fillStyle(
            0x07182a,
            1,
        );

        this.mount.fillRect(
            source.x - 14,
            source.y + 2,
            28,
            16,
        );

        // Temporary metal body.
        this.mount.fillStyle(
            0x58677a,
            1,
        );

        this.mount.fillRect(
            source.x - 11,
            source.y + 5,
            22,
            11,
        );

        // Barrel/muzzle support.
        this.mount.fillStyle(
            0x8fb5d6,
            1,
        );

        this.mount.fillRect(
            source.x - 3,
            source.y - 5,
            6,
            12,
        );

        this.mount.fillStyle(
            0xd7f9ff,
            1,
        );

        this.mount.fillRect(
            source.x - 1,
            source.y - 2,
            2,
            4,
        );
    }

    private getSourcePosition():
        Phaser.Math.Vector2 {
        return getBridgePlayerWeaponSourcePosition();
    }
}
