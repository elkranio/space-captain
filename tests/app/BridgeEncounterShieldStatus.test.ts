// tests/app/BridgeEncounterShieldStatus.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';
import {
    SHIP_DRIVE_STATUS,
} from '../../src/engine/defs/ship_drive';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import { ENCOUNTER_EVENT } from '../../src/engine/encounter/model/event';

describe('BridgeEncounterEngineEventHandler shield status', () => {
    it('does not update bridge status when only regeneration progress changes', () => {
        const { handler, runtime, emit } = createHandler();

        runtime.setPlayerShipShieldGeneratorState({
            charges: 2,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 0,
        });

        handler.handle([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED,

                shieldGenerator: {
                    charges: 2,
                    maxCharges: 3,

                    chargeRegenerationDurationMs: 20000,
                    chargeRegenerationElapsedMs: 5000,
                },
            },
        ]);

        expect(runtime.getCurrentRun().player.ship.shieldGenerator).toEqual({
            charges: 2,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 5000,
        });

        expect(emit).not.toHaveBeenCalled();
    });

    it('updates bridge status when shield charges change', () => {
        const { handler, runtime, emit } = createHandler();

        handler.handle([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED,

                shieldGenerator: {
                    charges: 2,
                    maxCharges: 3,

                    chargeRegenerationDurationMs: 20000,
                    chargeRegenerationElapsedMs: 0,
                },
            },
        ]);

        expect(runtime.getCurrentRun().player.ship.shieldGenerator.charges).toBe(2);

        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith(
            BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,

            {
                hull: {
                    current: 3,
                    max: 3,
                },

                drive: {
                    status:
                        SHIP_DRIVE_STATUS.ONLINE,
                },

                pointDefense: {
                    current: 4,
                    max: 4,
                },

                shieldGenerator: {
                    current: 2,
                    max: 3,
                },
            },
        );
    });
});

function createHandler() {
    const runtime = new GameRuntime();

    const emit = vi.fn();

    const eventBus = {
        emit,
    } as unknown as BridgeEventBus;

    return {
        runtime,
        emit,

        handler: new BridgeEncounterEngineEventHandler(
            eventBus,
            vi.fn(),
            runtime,
        ),
    };
}
