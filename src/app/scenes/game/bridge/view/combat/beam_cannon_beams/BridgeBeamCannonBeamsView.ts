// src/app/scenes/game/bridge/view/combat/beam_cannon_beams/BridgeBeamCannonBeamsView.ts

import {
    BEAM_CANNON_SHOT_OUTCOME,
} from '../../../../../../../engine/encounter/model/combat';
import type BridgeScene from '../../../BridgeScene';
import { SCREEN_SHAKE } from '../../../../../../theme/screen_shake';
import {
    BRIDGE_EVENT,
    type BridgeBeamCannonBeamFiredPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import {
    BRIDGE_PLAYER_HULL_COMBAT_POINTS,
} from '../bridge_player_hull_combat_points';
import BridgeBeamCannonBeamView from './beam/BridgeBeamCannonBeamView';
import {
    BRIDGE_BEAM_CANNON_MISS_ANCHORS,
    BRIDGE_BEAM_CANNON_TARGET_ANCHOR,
    getBridgeBeamCannonTargetPoint,
    type BridgeBeamCannonTargetAnchor,
} from './bridge_beam_cannon_target_anchors';

type GetObjectPosition = (objectId: string) => Phaser.Math.Vector2 | undefined;

// Manager-view коротких enemy beamCannon beam effects.
//
// source берётся из текущей presentation-позиции enemy actor.
//
// This is deliberately only a presentation anchor layer. Semantic ship-node
// targeting remains engine/domain work for later:
// - current hull HIT -> HULL_BOTTOM;
// - current Evade MISS -> one of four diagonal miss anchors;
// - ABSORBED keeps the existing shield impact point until shield targeting is
//   redesigned against the same anchor language.
export default class BridgeBeamCannonBeamsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly beams = new Set<BridgeBeamCannonBeamView>();

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        private readonly getObjectPosition: GetObjectPosition,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('vfx').add(this.root);

        this.eventBus.on(
            BRIDGE_EVENT.BEAM_CANNON_BEAM_FIRED,
            this.fireBeam,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.BEAM_CANNON_BEAM_FIRED,
            this.fireBeam,
            this,
        );

        for (const beam of this.beams) {
            beam.destroy();
        }

        this.beams.clear();
        this.root.destroy(false);
    }

    private fireBeam(payload: BridgeBeamCannonBeamFiredPayload): void {
        const sourcePosition = this.getObjectPosition(payload.sourceActorId);

        if (!sourcePosition) {
            throw new Error(
                `BeamCannon beam source object not found: ${payload.sourceActorId}`,
            );
        }

        const targetPosition =
            this.getTargetPosition(
                payload.outcome,
            );

        if (
            payload.outcome ===
            BEAM_CANNON_SHOT_OUTCOME.HIT
        ) {
            const shake =
                SCREEN_SHAKE.MEDIUM;

            this.scene.cameras.main.shake(
                shake.durationMs,
                shake.intensity,
            );
        }

        const beam = new BridgeBeamCannonBeamView({
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
        outcome:
            BridgeBeamCannonBeamFiredPayload['outcome'],
    ): Phaser.Math.Vector2 {
        const point =
            getBeamCannonTargetPoint(
                outcome,
            );

        return new Phaser.Math.Vector2(
            point.x,
            point.y,
        );
    }
}

function getBeamCannonTargetPoint(
    outcome:
        BridgeBeamCannonBeamFiredPayload['outcome'],
): {
    readonly x: number;
    readonly y: number;
} {
    switch (outcome) {
        case BEAM_CANNON_SHOT_OUTCOME.HIT:
            return getBridgeBeamCannonTargetPoint(
                BRIDGE_BEAM_CANNON_TARGET_ANCHOR
                    .HULL_BOTTOM,
            );

        case BEAM_CANNON_SHOT_OUTCOME.ABSORBED:
            return BRIDGE_PLAYER_HULL_COMBAT_POINTS
                .shieldImpactPoint;

        case BEAM_CANNON_SHOT_OUTCOME.MISS:
            return getBridgeBeamCannonTargetPoint(
                getRandomMissAnchor(),
            );

        default: {
            const exhaustiveOutcome:
                never =
                    outcome;

            return exhaustiveOutcome;
        }
    }
}

function getRandomMissAnchor():
    BridgeBeamCannonTargetAnchor {
    const index =
        Math.floor(
            Math.random() *
                BRIDGE_BEAM_CANNON_MISS_ANCHORS
                    .length,
        );

    return (
        BRIDGE_BEAM_CANNON_MISS_ANCHORS[
            index
        ] ??
        BRIDGE_BEAM_CANNON_TARGET_ANCHOR
            .MISS_TOP_LEFT
    );
}
