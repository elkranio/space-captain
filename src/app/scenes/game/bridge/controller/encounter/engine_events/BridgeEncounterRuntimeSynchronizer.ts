// src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterRuntimeSynchronizer.ts

import type {
    PlayerHullDamageResult,
} from '../../../../../../../engine/defs/player';
import { SPACE_ANCHOR_KIND } from '../../../../../../../engine/defs/universe';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    LASER_SHOT_OUTCOME,
} from '../../../../../../../engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_RESULT_KIND,
    type EncounterEvent,
} from '../../../../../../../engine/encounter/model/event';
import type { GameRuntime } from '../../../../../../runtime/GameRuntime';

// Event-driven transport для persistent mutations,
// которые нельзя восстановить из текущего combat frame:
// hull damage, drive/navigation changes, discovered anchors,
// destroyed persistent actors.
//
// Defense powerCore, shield emitter и installed weapons
// синхронизируются одним CombatPresentationSnapshot.
// Эти данные здесь повторно не записываются.
export default class BridgeEncounterRuntimeSynchronizer {
    constructor(
        private readonly gameRuntime:
            GameRuntime,
    ) {}

    public synchronize(
        event: EncounterEvent,
    ): void {
        switch (event.type) {
            case ENCOUNTER_EVENT
                .PLAYER_SHIP_DRIVE_DISRUPTED:
                this.gameRuntime
                    .setPlayerShipDriveState(
                        event.drive,
                    );

                this.gameRuntime
                    .setPlayerSpaceNavigation(
                        event.navigation,
                    );

                return;

            case ENCOUNTER_EVENT
                .PLAYER_SHIP_DRIVE_STATE_CHANGED:
                this.gameRuntime
                    .setPlayerShipDriveState(
                        event.drive,
                    );

                return;

            case ENCOUNTER_EVENT
                .OFFICER_TASK_ENDED:
                this.synchronizeOfficerTaskResult(
                    event,
                );

                return;

            case ENCOUNTER_EVENT
                .ENEMY_SHIP_DESTROYED:
                this.gameRuntime
                    .removeCurrentNodeActor(
                        event.actorId,
                    );

                return;

            case ENCOUNTER_EVENT
                .MISSILE_IMPACTED_PLAYER_SHIP:
                this.synchronizePlayerHull(
                    event,
                );

                return;

            case ENCOUNTER_EVENT
                .STICKY_MINE_DETONATED:
                this.assertIncomingStickyMine(
                    event,
                );

                this.synchronizePlayerHull(
                    event,
                );

                return;

            case ENCOUNTER_EVENT.LASER_FIRED:
                if (
                    event.outcome ===
                    LASER_SHOT_OUTCOME.HIT
                ) {
                    this.synchronizePlayerHull(
                        event,
                    );
                }

                return;

            default:
                return;
        }
    }

    private synchronizeOfficerTaskResult(
        event: Extract<
            EncounterEvent,
            {
                type:
                    typeof ENCOUNTER_EVENT
                        .OFFICER_TASK_ENDED;
            }
        >,
    ): void {
        if (
            event.result?.kind !==
            OFFICER_TASK_RESULT_KIND
                .JUMP_POINT_CALCULATED
        ) {
            return;
        }

        const anchor =
            event.result.anchor;

        this.gameRuntime
            .addCurrentNodeAnchor({
                kind:
                    SPACE_ANCHOR_KIND
                        .JUMP_POINT,

                jumpPoint: {
                    ...anchor.jumpPoint,
                },

                localPosition: {
                    ...anchor.localPosition,
                },
            });
    }

    private synchronizePlayerHull(
        result: PlayerHullDamageResult,
    ): void {
        this.gameRuntime
            .setPlayerShipHull(
                result.remainingHull,
            );
    }

    private assertIncomingStickyMine(
        event: Extract<
            EncounterEvent,
            {
                type:
                    typeof ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED;
            }
        >,
    ): void {
        if (
            event.mine.source.kind ===
                COMBAT_SOURCE_KIND.ACTOR &&
            event.mine.target.kind ===
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP
        ) {
            return;
        }

        throw new Error(
            'Detonated incoming sticky mine has ' +
                'invalid source or target: ' +
                event.mine.id +
                '/' +
                event.mine.source.kind +
                '/' +
                event.mine.target.kind,
        );
    }
}
