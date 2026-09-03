// tests/app/BridgeEncounterPlayerStickyMineEvents.test.ts

import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import {
    BRIDGE_EVENT,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_STICKY_MINE_OUTCOME,
    type StickyMineState,
} from '../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../src/engine/encounter/model/event';

const mine: StickyMineState = {
    id: 'sticky_mine_player_00',


    source: {
        kind:
            COMBAT_SOURCE_KIND
                .PLAYER_SHIP,
    },

    sourceWeaponId:
        'sticky_mine_dispenser_player_00',

    target: {
        kind:
            COMBAT_TARGET_KIND.ACTOR,

        actorId:
            'ship_enemy_00',
    },

    timeToDetonationMs: 7500,
    initialTimeToDetonationMs: 7500,

    damage: 1,
};

describe('Bridge player sticky-mine event mapping', () => {
    it('maps attach and resolution to outgoing-only bridge events', () => {
        const emit = vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const handler =
            new BridgeEncounterEngineEventHandler(
                eventBus,
            );

        handler.handle([
            {
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_STICKY_MINE_ATTACHED,

                mine: {
                    ...mine,

                    source: {
                        ...mine.source,
                    },

                    target: {
                        ...mine.target,
                    },
                },
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_STICKY_MINE_RESOLVED,

                mine: {
                    ...mine,

                    source: {
                        ...mine.source,
                    },

                    target: {
                        ...mine.target,
                    },

                    timeToDetonationMs: 0,
                },

                outcome:
                    PLAYER_STICKY_MINE_OUTCOME
                        .DETONATED,

                damage: 1,
                remainingHull: 2,
            },
        ]);

        expect(
            emit.mock.calls,
        ).toEqual([
            [
                BRIDGE_EVENT
                    .OUTGOING_STICKY_MINE_ADDED,

                {
                    mineId:
                        'sticky_mine_player_00',

                    targetActorId:
                        'ship_enemy_00',

                    initialTimeToDetonationMs:
                        7500,
                },
            ],

            [
                BRIDGE_EVENT
                    .OUTGOING_STICKY_MINE_REMOVED,

                {
                    mineId:
                        'sticky_mine_player_00',

                    targetActorId:
                        'ship_enemy_00',

                    outcome:
                        PLAYER_STICKY_MINE_OUTCOME
                            .DETONATED,
                },
            ],
        ]);

        expect(
            emit.mock.calls.some(
                ([eventName]) => {
                    return (
                        eventName ===
                            BRIDGE_EVENT
                                .STICKY_MINE_ADDED ||
                        eventName ===
                            BRIDGE_EVENT
                                .STICKY_MINE_REMOVED
                    );
                },
            ),
        ).toBe(false);

    });
});
