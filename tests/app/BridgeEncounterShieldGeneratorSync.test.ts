// tests/app/BridgeEncounterShieldGeneratorSync.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import { ENCOUNTER_EVENT } from '../../src/engine/encounter/model/event';

describe('BridgeEncounterEngineEventHandler shield generator sync', () => {
    it('syncs the complete engine shield-generator snapshot into GameRuntime', () => {
        const runtime = new GameRuntime();

        const emit = vi.fn();
        const setEncounterInteractive = vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const handler = new BridgeEncounterEngineEventHandler(eventBus, setEncounterInteractive, runtime);

        handler.handle([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED,

                shieldGenerator: {
                    charges: 1,
                    maxCharges: 3,

                    chargeRegenerationDurationMs: 20000,
                    chargeRegenerationElapsedMs: 7500,
                },
            },
        ]);

        expect(runtime.getCurrentRun().player.ship.shieldGenerator).toEqual({
            charges: 1,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 7500,
        });

        expect(emit).not.toHaveBeenCalled();
        expect(setEncounterInteractive).not.toHaveBeenCalled();
    });
});
