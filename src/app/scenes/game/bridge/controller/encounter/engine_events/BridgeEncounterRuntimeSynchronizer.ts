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

export type BridgeEncounterRuntimeSyncResult = {
    playerShipStatusChanged: boolean;
};

const NO_VISIBLE_RUNTIME_CHANGE:
    BridgeEncounterRuntimeSyncResult = {
        playerShipStatusChanged: false,
    };

const PLAYER_SHIP_STATUS_CHANGED:
    BridgeEncounterRuntimeSyncResult = {
        playerShipStatusChanged: true,
    };

// Единственный event-driven transport
// из EncounterEngine в persistent GameRuntime.
//
// Presentation events, interactivity и scene flow
// остаются в BridgeEncounterEngineEventHandler.
// Snapshot-based weapon/navigation sync остаётся
// явной ответственностью BridgeEncounterController.
export default class BridgeEncounterRuntimeSynchronizer {
    constructor(
        private readonly gameRuntime:
            GameRuntime,
    ) {}

    public synchronize(
        event: EncounterEvent,
    ): BridgeEncounterRuntimeSyncResult {
        switch (event.type) {
            case ENCOUNTER_EVENT
                .PLAYER_POINT_DEFENSE_CHARGE_SPENT: {
                const current =
                    this.gameRuntime
                        .getCurrentRun()
                        .player
                        .ship
                        .defenseCapacitor;

                this.gameRuntime
                    .setPlayerShipDefenseCapacitorState({
                        ...current,

                        charges:
                            event.remainingCharges,

                        // Spending restarts the sequential recharge.
                        rechargeElapsedMs: 0,
                    });

                return PLAYER_SHIP_STATUS_CHANGED;
            }


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

                return PLAYER_SHIP_STATUS_CHANGED;

            case ENCOUNTER_EVENT
                .PLAYER_SHIP_DRIVE_STATE_CHANGED:
                this.gameRuntime
                    .setPlayerShipDriveState(
                        event.drive,
                    );

                return PLAYER_SHIP_STATUS_CHANGED;

            case ENCOUNTER_EVENT
                .OFFICER_TASK_ENDED:
                this.synchronizeOfficerTaskResult(
                    event,
                );

                return NO_VISIBLE_RUNTIME_CHANGE;

            case ENCOUNTER_EVENT
                .ENEMY_SHIP_DESTROYED:
                this.gameRuntime
                    .removeCurrentNodeActor(
                        event.actorId,
                    );

                return NO_VISIBLE_RUNTIME_CHANGE;

            case ENCOUNTER_EVENT
                .MISSILE_IMPACTED_PLAYER_SHIP:
                return this.synchronizePlayerHull(
                    event,
                );

            case ENCOUNTER_EVENT
                .STICKY_MINE_DETONATED:
                this.assertIncomingStickyMine(
                    event,
                );

                return this.synchronizePlayerHull(
                    event,
                );

            case ENCOUNTER_EVENT.LASER_FIRED:
                if (
                    event.outcome ===
                    LASER_SHOT_OUTCOME.BLOCKED
                ) {
                    return NO_VISIBLE_RUNTIME_CHANGE;
                }

                return this.synchronizePlayerHull(
                    event,
                );

            default:
                return NO_VISIBLE_RUNTIME_CHANGE;
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
    ): BridgeEncounterRuntimeSyncResult {
        this.gameRuntime
            .setPlayerShipHull(
                result.remainingHull,
            );

        return result.appliedDamage > 0
            ? PLAYER_SHIP_STATUS_CHANGED
            : NO_VISIBLE_RUNTIME_CHANGE;
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
