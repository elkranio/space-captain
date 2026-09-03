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
    ENCOUNTER_EVENT,
} from '../../src/engine/encounter/model/event';

describe(
    'Bridge sticky-mine miss routing',
    () => {
        it(
            'maps an engine sticky-mine Evade miss to transient bridge presentation',
            () => {
                const emit =
                    vi.fn();

                const handler =
                    new BridgeEncounterEngineEventHandler(
                        {
                            emit,
                        } as unknown as BridgeEventBus,
                    );

                handler.handle([
                    {
                        type:
                            ENCOUNTER_EVENT
                                .STICKY_MINE_MISSED_PLAYER_SHIP,

                        sourceActorId:
                            'ship_enemy_00',

                        sourceWeaponId:
                            'sticky_mine_dispenser_00',
                    },
                ]);

                expect(
                    emit.mock.calls,
                ).toEqual([
                    [
                        BRIDGE_EVENT
                            .STICKY_MINE_MISSED_PLAYER_SHIP,

                        {
                            sourceActorId:
                                'ship_enemy_00',
                        },
                    ],
                ]);
            },
        );
    },
);
