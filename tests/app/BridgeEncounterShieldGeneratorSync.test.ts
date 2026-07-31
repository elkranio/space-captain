// tests/app/BridgeEncounterShieldGeneratorSync.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';
import {
    SHIP_DRIVE_STATUS,
} from '../../src/engine/defs/ship_drive';
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
                    current: 1,
                    max: 3,
                },
            },
        );

        expect(setEncounterInteractive).not.toHaveBeenCalled();
    });
});
