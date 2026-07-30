// tests/app/BridgeEncounterShieldPresentation.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import { LASER_TARGET_ZONE } from '../../src/engine/defs/laser';
import { OFFICER_ROLE } from '../../src/engine/defs/officer';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
} from '../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../src/engine/encounter/model/officer_task';

describe('BridgeEncounterEngineEventHandler player shield presentation', () => {
    it('publishes a deployed shield before clearing Engineer activity', () => {
        const emit = vi.fn();

        const handler = new BridgeEncounterEngineEventHandler(
            {
                emit,
            } as unknown as BridgeEventBus,

            vi.fn(),
            new GameRuntime(),
        );

        handler.handle([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: {
                    id: 'task_engineer_shield',

                    kind: OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD,
                    role: OFFICER_ROLE.ENGINEER,
                    sourceCommandId:
                        ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_RIGHT,

                    shieldZone: LASER_TARGET_ZONE.RIGHT,

                    label: 'SHIELD RIGHT',
                    showProgress: true,

                    durationMs: 2000,
                    elapsedMs: 2000,
                },

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                result: {
                    kind: OFFICER_TASK_RESULT_KIND.SHIELD_DEPLOYED,

                    shield: {
                        zone: LASER_TARGET_ZONE.RIGHT,

                        elapsedMs: 0,
                        durationMs: 5000,
                    },
                },
            },
        ]);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.PLAYER_SHIELD_UPDATED,

                {
                    zone: LASER_TARGET_ZONE.RIGHT,

                    remainingDurationMs: 5000,
                    initialDurationMs: 5000,
                },
            ],

            [
                BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED,

                {
                    role: OFFICER_ROLE.ENGINEER,
                },
            ],
        ]);
    });
});
