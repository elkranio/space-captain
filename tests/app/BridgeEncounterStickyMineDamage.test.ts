// tests/app/BridgeEncounterStickyMineDamage.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterPersistenceSynchronizer from '../../src/app/scenes/game/bridge/controller/encounter/BridgeEncounterPersistenceSynchronizer';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import {
    BRIDGE_EVENT,
    BRIDGE_STICKY_MINE_REMOVAL_OUTCOME,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    type StickyMineState,
} from '../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../../src/engine/encounter/model/event';

describe('Bridge sticky-mine damage', () => {
    it('persists incoming mine damage events and forwards their removal presentation', () => {
        const runtime = new GameRuntime();

        const emit = vi.fn();

        const handler =
            new BridgeEncounterEngineEventHandler(
                {
                    emit,
                } as unknown as BridgeEventBus,
            );

        const mine1 = createMine(
            'sticky_mine_1',
        );
        const mine2 = createMine(
            'sticky_mine_2',
        );
        const mine3 = createMine(
            'sticky_mine_3',
        );

        syncAndHandleEvents(
            runtime,
            handler,
            [
            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_ATTACHED,

                mine: mine1,
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine: {
                    ...mine1,
                    timeToDetonationMs: 0,
                },

                appliedDamage: 1,
                remainingHull: 2,
                destroyed: false,
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine: {
                    ...mine2,
                    timeToDetonationMs: 0,
                },

                appliedDamage: 1,
                remainingHull: 1,
                destroyed: false,
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine: {
                    ...mine3,
                    timeToDetonationMs: 0,
                },

                appliedDamage: 1,
                remainingHull: 0,
                destroyed: true,
            },
            ],
        );

        expect(
            runtime.getCurrentRun()
                .player.ship.hull,
        ).toBe(0);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT
                    .STICKY_MINE_ADDED,

                {
                    mineId: 'sticky_mine_1',

                    sourceActorId:
                        'ship_enemy_00',

                    initialTimeToDetonationMs:
                        7500,
                },
            ],

            [
                BRIDGE_EVENT
                    .STICKY_MINE_REMOVED,

                {
                    mineId: 'sticky_mine_1',

                    outcome:
                        BRIDGE_STICKY_MINE_REMOVAL_OUTCOME
                            .DETONATED,
                },
            ],

            [
                BRIDGE_EVENT
                    .STICKY_MINE_REMOVED,

                {
                    mineId: 'sticky_mine_2',

                    outcome:
                        BRIDGE_STICKY_MINE_REMOVAL_OUTCOME
                            .DETONATED,
                },
            ],

            [
                BRIDGE_EVENT
                    .STICKY_MINE_REMOVED,

                {
                    mineId: 'sticky_mine_3',

                    outcome:
                        BRIDGE_STICKY_MINE_REMOVAL_OUTCOME
                            .DETONATED,
                },
            ],

        ]);
    });
});

function createMine(
    id: string,
): StickyMineState {
    return {
        id,


        source: {
            kind:
                COMBAT_SOURCE_KIND.ACTOR,

            actorId: 'ship_enemy_00',
        },

        sourceWeaponId:
            'sticky_mine_dispenser_00',

        target: {
            kind:
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP,
        },

        timeToDetonationMs: 7500,
        initialTimeToDetonationMs: 7500,

        damage: 1,
    };
}

function syncAndHandleEvents(
    runtime: GameRuntime,
    handler: BridgeEncounterEngineEventHandler,
    events: EncounterEvent[],
): void {
    const persistenceSynchronizer =
        new BridgeEncounterPersistenceSynchronizer(
            runtime,
        );

    for (const event of events) {
        persistenceSynchronizer.syncEvent(event);
        handler.handle(event);
    }
}
