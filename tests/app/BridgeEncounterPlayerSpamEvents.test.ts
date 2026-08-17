import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import {
    BRIDGE_EVENT,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import {
    OFFICER_ROLE,
} from '../../src/engine/defs/officer';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
} from '../../src/engine/encounter/model/command';
import {
    PLAYER_SPAM_CHANNEL_OUTCOME,
} from '../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
} from '../../src/engine/encounter/model/officer_task';

describe(
    'BridgeEncounterEngineEventHandler player spam events',
    () => {
        it(
            'accepts spam task start and maps the full channel lifecycle',
            () => {
                const emit = vi.fn();

                const handler =
                    new BridgeEncounterEngineEventHandler(
                        {
                            emit,
                        } as unknown as BridgeEventBus,

                        vi.fn(),
                        new GameRuntime(),
                    );

                expect(() => {
                    handler.handle([
                        {
                            type:
                                ENCOUNTER_EVENT
                                    .OFFICER_TASK_STARTED,

                            task: {
                                id:
                                    'task_spam_1',

                                kind:
                                    OFFICER_TASK_KIND
                                        .SCIENCE_FIRE_SPAM,

                                role:
                                    OFFICER_ROLE
                                        .SCIENCE,

                                sourceCommandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .SCIENCE_FIRE_SPAM,

                                weaponId:
                                    'spam_projector_player_00',

                                targetActorId:
                                    'ship_enemy_00',

                                label:
                                    'SPAM PROJECT',

                                showProgress:
                                    false,

                                durationMs:
                                    null,

                                elapsedMs:
                                    0,

                                canBeCancelledByPlayer:
                                    false,

                                canBeInterruptedByDamage:
                                    true,
                            },
                        },

                        {
                            type:
                                ENCOUNTER_EVENT
                                    .PLAYER_SPAM_CHANNEL_STARTED,

                            channelId:
                                'player_spam:task_spam_1',

                            sourceWeaponId:
                                'spam_projector_player_00',

                            targetActorId:
                                'ship_enemy_00',
                        },

                        {
                            type:
                                ENCOUNTER_EVENT
                                    .PLAYER_SPAM_CHANNEL_ENDED,

                            channelId:
                                'player_spam:task_spam_1',

                            sourceWeaponId:
                                'spam_projector_player_00',

                            targetActorId:
                                'ship_enemy_00',

                            outcome:
                                PLAYER_SPAM_CHANNEL_OUTCOME
                                    .EXPIRED,
                        },
                    ]);
                }).not.toThrow();

                expect(
                    emit.mock.calls,
                ).toEqual([
                    [
                        BRIDGE_EVENT
                            .OUTGOING_SPAM_CHANNEL_STARTED,

                        {
                            channelId:
                                'player_spam:task_spam_1',

                            targetActorId:
                                'ship_enemy_00',
                        },
                    ],

                    [
                        BRIDGE_EVENT
                            .OUTGOING_SPAM_CHANNEL_ENDED,

                        {
                            channelId:
                                'player_spam:task_spam_1',

                            targetActorId:
                                'ship_enemy_00',

                            outcome:
                                PLAYER_SPAM_CHANNEL_OUTCOME
                                    .EXPIRED,
                        },
                    ],
                ]);
            },
        );
    },
);
