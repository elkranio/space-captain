// src/app/scenes/game/bridge/view/combat/player_beam_cannon/BridgePlayerBeamCannonView.ts

import {
    BEAM_CANNON_SHOT_OUTCOME,
} from '../../../../../../../engine/encounter/model/combat';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgePlayerBeamCannonChargingClearedPayload,
    type BridgePlayerBeamCannonChargingStartedPayload,
    type BridgePlayerBeamCannonFiredPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import {
    getBridgePlayerWeaponSourcePosition,
} from '../bridge_player_weapon_layout';
import BridgeBeamCannonBeamView from '../beam_cannon_beams/beam/BridgeBeamCannonBeamView';
import BridgeBeamCannonChargeView from '../beam_cannon_charge/BridgeBeamCannonChargeView';
import BridgePlayerBeamCannonImpactView from './impact/BridgePlayerBeamCannonImpactView';
import {
    getPlayerBeamCannonMissTarget,
    isPlayerBeamCannonMissLeft,
} from './bridge_player_beam_cannon_miss_target';

type GetObjectPosition = (
    objectId: string,
) => Phaser.Math.Vector2 | undefined;

type GetObjectVisualBounds = (
    objectId: string,
) => Phaser.Geom.Rectangle | undefined;

// Temporary player weapon presentation.
//
// Baseline player beamCannon now fires at the visual center of the
// target actor. Node-specific impact positions return together
// with the future targeting-node contract.
export default class BridgePlayerBeamCannonView {
    // Normal/right-side Beam VFX are above encounter objects.
    private readonly root:
        Phaser.GameObjects.Container;

    // Left-side Evade miss passes under/behind the enemy sprite.
    private readonly behindObjectsRoot:
        Phaser.GameObjects.Container;

    private readonly mount:
        Phaser.GameObjects.Graphics;

    private readonly beams =
        new Set<BridgeBeamCannonBeamView>();

    private readonly impacts =
        new Set<BridgePlayerBeamCannonImpactView>();

    private chargeView?:
        BridgeBeamCannonChargeView;

    private chargingWeaponId?:
        string;

    constructor(
        private readonly scene:
            BridgeScene,

        private readonly eventBus:
            BridgeEventBus,

        private readonly getObjectPosition:
            GetObjectPosition,

        private readonly getObjectVisualBounds:
            GetObjectVisualBounds,
    ) {
        this.behindObjectsRoot =
            this.scene.add.container(
                0,
                0,
            );

        this.scene.layers
            .get('objects')
            .add(
                this.behindObjectsRoot,
            );

        this.scene.layers
            .sendToBack(
                'objects',
                this.behindObjectsRoot,
            );

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
                .PLAYER_BEAM_CANNON_CHARGING_STARTED,

            this.startCharging,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_BEAM_CANNON_CHARGING_CLEARED,

            this.clearCharging,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_BEAM_CANNON_FIRED,

            this.fire,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_BEAM_CANNON_CHARGING_STARTED,

            this.startCharging,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_BEAM_CANNON_CHARGING_CLEARED,

            this.clearCharging,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_BEAM_CANNON_FIRED,

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

        this.behindObjectsRoot
            .destroy(true);

        this.root.destroy(true);

        this.chargeView =
            undefined;

        this.chargingWeaponId =
            undefined;
    }

    private startCharging(
        payload:
            BridgePlayerBeamCannonChargingStartedPayload,
    ): void {
        this.chargeView?.destroy();

        this.chargingWeaponId =
            payload.weaponId;

        this.chargeView =
            BridgeBeamCannonChargeView.create({
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
            BridgePlayerBeamCannonChargingClearedPayload,
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
            BridgePlayerBeamCannonFiredPayload,
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
                'Player beamCannon target ' +
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

        const beamTargetPosition =
            this.getBeamTargetPosition(
                payload,
                sourcePosition,
                targetPosition,
            );

        const beamParent =
            this.getBeamParent(
                payload,
                targetPosition,
            );

        const beam =
            new BridgeBeamCannonBeamView({
                scene:
                    this.scene,

                parent:
                    beamParent,

                sourcePosition,

                targetPosition:
                    beamTargetPosition,

                sourceNear: true,

                onComplete: () => {
                    beam.destroy();

                    this.beams.delete(
                        beam,
                    );
                },
            });

        this.beams.add(beam);

        // Evade miss runs through the left/right bound lane and continues
        // beyond the viewport. Left miss is behind the enemy sprite, right
        // miss is above it. There is no contact VFX.
        if (
            payload.outcome ===
            BEAM_CANNON_SHOT_OUTCOME
                .MISS
        ) {
            return;
        }

        const impact =
            new BridgePlayerBeamCannonImpactView({
                scene:
                    this.scene,

                parent:
                    this.root,

                position:
                    targetPosition,

                blocked:
                    payload.outcome ===
                    BEAM_CANNON_SHOT_OUTCOME
                        .ABSORBED,

                onComplete: () => {
                    impact.destroy();

                    this.impacts.delete(
                        impact,
                    );
                },
            });

        this.impacts.add(impact);
    }

    private getBeamTargetPosition(
        payload:
            BridgePlayerBeamCannonFiredPayload,

        sourcePosition:
            Phaser.Math.Vector2,

        canonicalTargetPosition:
            Phaser.Math.Vector2,
    ): Phaser.Math.Vector2 {
        if (
            payload.outcome !==
            BEAM_CANNON_SHOT_OUTCOME
                .MISS
        ) {
            return canonicalTargetPosition;
        }

        const visualBounds =
            this.getObjectVisualBounds(
                payload.targetActorId,
            );

        if (!visualBounds) {
            throw new Error(
                'Player beamCannon miss target visual bounds not found: ' +
                    payload.targetActorId,
            );
        }

        const missTarget =
            getPlayerBeamCannonMissTarget({
                sourceX:
                    sourcePosition.x,

                sourceY:
                    sourcePosition.y,

                canonicalTargetX:
                    canonicalTargetPosition.x,

                presentedTargetLeft:
                    visualBounds.left,

                presentedTargetRight:
                    visualBounds.right,

                presentedTargetCenterX:
                    visualBounds.centerX,

                presentedTargetCenterY:
                    visualBounds.centerY,

                viewportWidth:
                    this.scene.scale.width,

                viewportHeight:
                    this.scene.scale.height,
            });

        return new Phaser.Math.Vector2(
            missTarget.x,
            missTarget.y,
        );
    }

    private getBeamParent(
        payload:
            BridgePlayerBeamCannonFiredPayload,

        canonicalTargetPosition:
            Phaser.Math.Vector2,
    ): Phaser.GameObjects.Container {
        if (
            payload.outcome !==
            BEAM_CANNON_SHOT_OUTCOME
                .MISS
        ) {
            return this.root;
        }

        const visualBounds =
            this.getObjectVisualBounds(
                payload.targetActorId,
            );

        if (!visualBounds) {
            throw new Error(
                'Player beamCannon miss target visual bounds not found: ' +
                    payload.targetActorId,
            );
        }

        return isPlayerBeamCannonMissLeft(
            canonicalTargetPosition.x,
            visualBounds.centerX,
        )
            ? this.behindObjectsRoot
            : this.root;
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
