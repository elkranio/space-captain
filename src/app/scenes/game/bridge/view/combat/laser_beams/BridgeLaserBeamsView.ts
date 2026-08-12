// src/app/scenes/game/bridge/view/combat/laser_beams/BridgeLaserBeamsView.ts

import {
    LASER_SHOT_OUTCOME,
} from '../../../../../../../engine/encounter/model/combat';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeLaserBeamFiredPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import {
    BRIDGE_PLAYER_HULL_COMBAT_POINTS,
} from '../bridge_player_hull_combat_points';
import BridgeLaserBeamView from './beam/BridgeLaserBeamView';

type GetObjectPosition = (objectId: string) => Phaser.Math.Vector2 | undefined;

// Manager-view коротких enemy laser beam effects.
//
// source берётся из текущей presentation-позиции enemy actor.
// Пока semantic impact target не введён, входящий beam визуально
// приходит в центр нижней части viewscreen.
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

        const targetPosition =
            this.getTargetPosition(
                payload.outcome,
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
        outcome:
            BridgeLaserBeamFiredPayload['outcome'],
    ): Phaser.Math.Vector2 {
        const point =
            getLaserTargetPoint(
                outcome,
            );

        return new Phaser.Math.Vector2(
            point.x,
            point.y,
        );
    }
}

function getLaserTargetPoint(
    outcome:
        BridgeLaserBeamFiredPayload['outcome'],
): {
    readonly x: number;
    readonly y: number;
} {
    switch (outcome) {
        case LASER_SHOT_OUTCOME.HIT:
            return BRIDGE_PLAYER_HULL_COMBAT_POINTS
                .hullImpactPoint;

        case LASER_SHOT_OUTCOME.ABSORBED:
            return BRIDGE_PLAYER_HULL_COMBAT_POINTS
                .shieldImpactPoint;

        default: {
            const exhaustiveOutcome:
                never =
                    outcome;

            return exhaustiveOutcome;
        }
    }
}
