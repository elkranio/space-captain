// tests/app/BridgeEncounterLaserResolution.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import { LASER_TARGET_ZONE } from '../../src/engine/defs/laser';
import {
    COMBAT_TARGET_KIND,
    LASER_SHOT_OUTCOME,
    THREAT_IDENTIFICATION_STATUS,
    type LaserAttackState,
} from '../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../src/engine/encounter/model/event';

describe('BridgeEncounterEngineEventHandler laser resolution', () => {
    it('clears the common targeting warning when laser charging starts', () => {
        const { handler, emit } = createHandler();

        handler.handle([
            {
                type: ENCOUNTER_EVENT.LASER_ATTACK_STARTED,

                attack: createAttack(),
            },
        ]);

        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith(
            BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED,
        );
    });

    it('does not damage hull when the laser is blocked', () => {
        const { handler, runtime, emit, setEncounterInteractive } = createHandler();

        handler.handle([
            {
                type: ENCOUNTER_EVENT.LASER_FIRED,

                attack: createAttack(),

                outcome: LASER_SHOT_OUTCOME.BLOCKED,
            },
        ]);

        expect(runtime.getCurrentRun().player.ship.hull).toBe(3);

        expect(emit).not.toHaveBeenCalled();
        expect(setEncounterInteractive).not.toHaveBeenCalled();
    });

    it('damages hull when the laser hits', () => {
        const { handler, runtime, emit, setEncounterInteractive } = createHandler();

        handler.handle([
            {
                type: ENCOUNTER_EVENT.LASER_FIRED,

                attack: createAttack(),

                outcome: LASER_SHOT_OUTCOME.HIT,
                damage: 1,
            },
        ]);

        expect(runtime.getCurrentRun().player.ship.hull).toBe(2);

        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith(
            BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,

            {
                hull: {
                    current: 2,
                    max: 3,
                },

                pointDefense: {
                    current: 4,
                    max: 4,
                },

                shieldGenerator: {
                    current: 3,
                    max: 3,
                },
            },
        );

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

        targetZone: LASER_TARGET_ZONE.CENTER,

        identification: {
            status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
        },
    };
}
