// tests/app/BridgeEncounterStickyMineDamage.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import {
    BRIDGE_EVENT,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import { SCENE_KEY } from '../../src/app/scenes/scene_key';
import type {
    StickyMineState,
} from '../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../src/engine/encounter/model/event';
import {
    createBridgePlayerShipStatusPayload,
} from './fixtures/create_bridge_player_ship_status_payload';

describe('Bridge sticky-mine damage', () => {
    it('clears targeting warning and destroys the starter ship after three detonations', () => {
        const runtime = new GameRuntime();

        const emit = vi.fn();
        const setEncounterInteractive = vi.fn();

        const handler =
            new BridgeEncounterEngineEventHandler(
                {
                    emit,
                } as unknown as BridgeEventBus,

                setEncounterInteractive,
                runtime,
            );

        const mine1 = createMine(
            'sticky_mine_1',
        );
        const mine2 = createMine(
            'sticky_mine_2',
        );
        const mine3 = createMine(
            'sticky_mine_3',
        );

        handler.handle([
            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_ATTACHED,

                mine: mine1,
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine: {
                    ...mine1,
                    timeToDetonationMs: 0,
                },

                damage: 1,
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine: {
                    ...mine2,
                    timeToDetonationMs: 0,
                },

                damage: 1,
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine: {
                    ...mine3,
                    timeToDetonationMs: 0,
                },

                damage: 1,
            },
        ]);

        expect(
            runtime.getCurrentRun()
                .player.ship.hull,
        ).toBe(0);

        expect(
            setEncounterInteractive,
        ).toHaveBeenCalledTimes(1);

        expect(
            setEncounterInteractive,
        ).toHaveBeenCalledWith(false);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT
                    .MISSILE_TARGETING_WARNING_CLEARED,
            ],

            [
                BRIDGE_EVENT
                    .PLAYER_SHIP_STATUS_UPDATED,

                createBridgePlayerShipStatusPayload({
                    hull: {
                        current: 2,
                    },
                }),
            ],

            [
                BRIDGE_EVENT
                    .PLAYER_SHIP_STATUS_UPDATED,

                createBridgePlayerShipStatusPayload({
                    hull: {
                        current: 1,
                    },
                }),
            ],

            [
                BRIDGE_EVENT
                    .PLAYER_SHIP_STATUS_UPDATED,

                createBridgePlayerShipStatusPayload({
                    hull: {
                        current: 0,
                    },
                }),
            ],

            [
                BRIDGE_EVENT
                    .SCENE_TRANSITION_REQUESTED,

                {
                    sceneKey: SCENE_KEY.END,
                },
            ],
        ]);
    });
});

function createMine(
    id: string,
): StickyMineState {
    return {
        id,

        sourceActorId: 'ship_enemy_00',
        sourceWeaponId:
            'sticky_mine_dispenser_00',

        timeToDetonationMs: 7500,
        initialTimeToDetonationMs: 7500,

        damage: 1,
    };
}
