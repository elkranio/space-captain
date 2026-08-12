// tests/app/BridgeEncounterLaserResolution.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import {
    COMBAT_TARGET_KIND,
    LASER_SHOT_OUTCOME,
    type LaserAttackState,
} from '../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../src/engine/encounter/model/event';

describe('BridgeEncounterEngineEventHandler laser resolution', () => {
    it('clears the common warning and adds a laser threat when charging starts', () => {
        const { handler, emit } = createHandler();

        handler.handle([
            {
                type: ENCOUNTER_EVENT.LASER_ATTACK_STARTED,

                attack: createAttack(),
            },
        ]);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED,
            ],

            [
                BRIDGE_EVENT.LASER_THREAT_ADDED,

                {
                    attackId: 'laser_attack_1',

                    designation: 'L1',

                    sourceActorId: 'ship_enemy_00',
                },
            ],
        ]);
    });

    it('removes the threat, emits a hit beam and damages hull', () => {
        const { handler, runtime, emit, setEncounterInteractive } = createHandler();

        handler.handle([
            {
                type: ENCOUNTER_EVENT.LASER_FIRED,

                attack: createAttack(),

                outcome: LASER_SHOT_OUTCOME.HIT,
                appliedDamage: 1,
                remainingHull: 2,
                destroyed: false,
            },
        ]);

        expect(runtime.getCurrentRun().player.ship.hull).toBe(2);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.LASER_THREAT_REMOVED,

                {
                    attackId: 'laser_attack_1',
                },
            ],

            [
                BRIDGE_EVENT.LASER_BEAM_FIRED,

                {
                    sourceActorId: 'ship_enemy_00',

                    outcome:
                        LASER_SHOT_OUTCOME.HIT,
                },
            ],

        ]);

        expect(setEncounterInteractive).not.toHaveBeenCalled();
    });
});

function createHandler() {
    const runtime = new GameRuntime();

    const emit = vi.fn();
    const setEncounterInteractive = vi.fn();

    const eventBus = {
        emit,
    } as unknown as BridgeEventBus;

    return {
        runtime,
        emit,
        setEncounterInteractive,

        handler: new BridgeEncounterEngineEventHandler(
            eventBus,
            setEncounterInteractive,
            runtime,
        ),
    };
}

function createAttack(): LaserAttackState {
    return {
        id: 'laser_attack_1',
        designation: 'L1',

        sourceActorId: 'ship_enemy_00',
        sourceWeaponId: 'laser_00',

        target: {
            kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
        },

    };
}
