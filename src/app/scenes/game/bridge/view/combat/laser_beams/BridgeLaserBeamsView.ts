// src/app/scenes/game/bridge/view/combat/laser_beams/BridgeLaserBeamsView.ts

import { LASER_TARGET_ZONE, type LaserTargetZone } from '../../../../../../../engine/defs/laser';
import { LASER_SHOT_OUTCOME } from '../../../../../../../engine/encounter/model/combat';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeLaserBeamFiredPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { BRIDGE_VIEWSCREEN_RECT } from '../../bridge_viewscreen_layout';
import BridgeLaserBeamView from './beam/BridgeLaserBeamView';

type GetObjectPosition = (objectId: string) => Phaser.Math.Vector2 | undefined;

const LASER_TARGET_LAYOUT = {
    leftXRatio: 1 / 6,
    centerXRatio: 1 / 2,
    rightXRatio: 5 / 6,

    blockedYFromBottom: 62,
    hitYFromBottom: 12,
} as const;

// Manager-view коротких enemy laser beam effects.
//
// source берётся из текущей presentation-позиции enemy actor.
// target определяется зоной и outcome:
// - BLOCKED останавливается на будущей плоскости shield;
// - HIT проходит глубже, почти до нижней границы viewscreen.
export default class BridgeLaserBeamsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly beams = new Set<BridgeLaserBeamView>();

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        private readonly getObjectPosition: GetObjectPosition,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('vfx').add(this.root);

        this.eventBus.on(
            BRIDGE_EVENT.LASER_BEAM_FIRED,
            this.fireBeam,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.LASER_BEAM_FIRED,
            this.fireBeam,
            this,
        );

        for (const beam of this.beams) {
            beam.destroy();
        }

        this.beams.clear();
        this.root.destroy(false);
    }

    private fireBeam(payload: BridgeLaserBeamFiredPayload): void {
        const sourcePosition = this.getObjectPosition(payload.sourceActorId);

        if (!sourcePosition) {
            throw new Error(
                `Laser beam source object not found: ${payload.sourceActorId}`,
            );
        }

        const targetPosition = this.getTargetPosition(
            payload.targetZone,
            payload.outcome === LASER_SHOT_OUTCOME.BLOCKED,
        );

        const beam = new BridgeLaserBeamView({
            scene: this.scene,
            parent: this.root,

            sourcePosition,
            targetPosition,

            onComplete: () => {
                beam.destroy();
                this.beams.delete(beam);
            },
        });

        this.beams.add(beam);
    }

    private getTargetPosition(
        targetZone: LaserTargetZone,
        blocked: boolean,
    ): Phaser.Math.Vector2 {
        const xRatio = this.getTargetXRatio(targetZone);

        return new Phaser.Math.Vector2(
            Math.round(
                BRIDGE_VIEWSCREEN_RECT.x +
                    BRIDGE_VIEWSCREEN_RECT.width * xRatio,
            ),

            BRIDGE_VIEWSCREEN_RECT.y +
                BRIDGE_VIEWSCREEN_RECT.height -
                (blocked
                    ? LASER_TARGET_LAYOUT.blockedYFromBottom
                    : LASER_TARGET_LAYOUT.hitYFromBottom),
        );
    }

    private getTargetXRatio(targetZone: LaserTargetZone): number {
        switch (targetZone) {
            case LASER_TARGET_ZONE.LEFT:
                return LASER_TARGET_LAYOUT.leftXRatio;

            case LASER_TARGET_ZONE.CENTER:
                return LASER_TARGET_LAYOUT.centerXRatio;

            case LASER_TARGET_ZONE.RIGHT:
                return LASER_TARGET_LAYOUT.rightXRatio;
        }
    }
}
