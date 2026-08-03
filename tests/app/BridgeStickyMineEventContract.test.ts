// tests/app/BridgeStickyMineEventContract.test.ts

import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import {
    BRIDGE_EVENT,
    BRIDGE_STICKY_MINE_REMOVAL_OUTCOME,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import {
    OFFICER_ROLE,
} from '../../src/engine/defs/officer';
import {
    STICKY_MINE_ID,
} from '../../src/engine/defs/sticky_mine';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
    type EncounterEvent,
} from '../../src/engine/encounter/model/event';

describe('Bridge sticky-mine event contract', () => {
    it('maps attach, clear and detonation to bridge lifecycle', () => {
        const emit = vi.fn();

        const handler =
            new BridgeEncounterEngineEventHandler(
                {
                    emit,
                } as unknown as BridgeEventBus,

                vi.fn(),
                new GameRuntime(),
            );

        handler.handle([
            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_ATTACHED,

                mine: createMine(
                    'mine_1',
                    7500,
                ),
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .OFFICER_TASK_ENDED,

                task: {
                    role: OFFICER_ROLE.SCIENCE,
                },

                outcome:
                    OFFICER_TASK_OUTCOME
                        .COMPLETED,

                result: {
                    kind:
                        OFFICER_TASK_RESULT_KIND
                            .STICKY_MINE_CLEARED,

                    mineId: 'mine_1',
                },
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine: createMine(
                    'mine_2',
                    0,
                ),

                appliedDamage: 1,
                remainingHull: 2,
                destroyed: false,
            },
        ] as EncounterEvent[]);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT
                    .MISSILE_TARGETING_WARNING_CLEARED,
            ],

            [
                BRIDGE_EVENT
                    .STICKY_MINE_ADDED,

                {
                    mineId: 'mine_1',
                    sourceActorId: 'enemy',
                    initialTimeToDetonationMs:
                        7500,
                },
            ],

            [
                BRIDGE_EVENT
                    .STICKY_MINE_REMOVED,

                {
                    mineId: 'mine_1',

                    outcome:
                        BRIDGE_STICKY_MINE_REMOVAL_OUTCOME
                            .CLEARED,
                },
            ],

            [
                BRIDGE_EVENT
                    .OFFICER_ACTIVITY_CLEARED,

                {
                    role:
                        OFFICER_ROLE.SCIENCE,
                },
            ],

            [
                BRIDGE_EVENT
                    .STICKY_MINE_REMOVED,

                {
                    mineId: 'mine_2',

                    outcome:
                        BRIDGE_STICKY_MINE_REMOVAL_OUTCOME
                            .DETONATED,
                },
            ],

            [
                BRIDGE_EVENT
                    .PLAYER_SHIP_STATUS_UPDATED,

                expect.any(Object),
            ],
        ]);
    });
});

function createMine(
    id: string,
    timeToDetonationMs: number,
) {
    return {
        id,

        mineId:
            STICKY_MINE_ID.BASIC_00,

        source: {
            kind:
                COMBAT_SOURCE_KIND.ACTOR,

            actorId: 'enemy',
        },

        sourceWeaponId: 'dispenser',

        target: {
            kind:
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP,
        },

        timeToDetonationMs,
        initialTimeToDetonationMs: 7500,

        damage: 1,
    };
}
