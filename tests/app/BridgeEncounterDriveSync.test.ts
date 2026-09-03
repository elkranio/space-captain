// tests/app/BridgeEncounterDriveSync.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterPersistenceSynchronizer from '../../src/app/scenes/game/bridge/controller/encounter/BridgeEncounterPersistenceSynchronizer';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import {
    BRIDGE_EVENT,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../src/engine/defs/player_location';
import {
    SHIP_DRIVE_ID,
    SHIP_DRIVE_STATUS,
} from '../../src/engine/defs/ship_drive';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../../src/engine/encounter/model/event';

describe('Bridge encounter drive sync', () => {
    it('persists repaired drive state without legacy status presentation', () => {
        const runtime = new GameRuntime();
        const emit = vi.fn();

        runtime.setPlayerShipDriveState({
            id: 'drive_player_00',
            driveId:
                SHIP_DRIVE_ID.BASIC_00,

            status:
                SHIP_DRIVE_STATUS.DISABLED,
        });

        const handler =
            new BridgeEncounterEngineEventHandler(
                {
                    emit,
                } as unknown as BridgeEventBus,
            );

        syncAndHandleEvents(
            runtime,
            handler,
            [
            {
                type:
                    ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_STATE_CHANGED,

                drive: {
                    id: 'drive_player_00',
                    driveId:
                        SHIP_DRIVE_ID.BASIC_00,
                    integrity: 2,

                    status:
                        SHIP_DRIVE_STATUS.ONLINE,
                },
            },
            ],
        );

        expect(
            runtime.getCurrentRun().player.ship.drive.status,
        ).toBe(SHIP_DRIVE_STATUS.ONLINE);

        expect(emit.mock.calls).toEqual([]);
    });

    it('persists disruption and requests VFX', () => {
        const runtime = new GameRuntime();
        const emit = vi.fn();

        const handler =
            new BridgeEncounterEngineEventHandler(
                {
                    emit,
                } as unknown as BridgeEventBus,
            );

        syncAndHandleEvents(
            runtime,
            handler,
            [
            {
                type:
                    ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,

                sourceActorId: 'ship_enemy_00',

                drive: {
                    id: 'drive_player_00',
                    driveId:
                        SHIP_DRIVE_ID.BASIC_00,
                    integrity: 0,

                    status:
                        SHIP_DRIVE_STATUS.DISABLED,
                },

                navigation: {
                    kind:
                        PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                    anchorId: 'anchor_safe_00',
                },
            },
            ],
        );

        expect(
            runtime.getCurrentRun().player.ship.drive.status,
        ).toBe(SHIP_DRIVE_STATUS.DISABLED);

        const location =
            runtime.getCurrentRun().player.location;

        if (
            location.kind !==
            PLAYER_LOCATION_KIND.SPACE
        ) {
            throw new Error(
                'Expected player in space',
            );
        }

        expect(location.navigation).toEqual({
            kind:
                PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: 'anchor_safe_00',
        });

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,
            ],
        ]);
    });
});

function syncAndHandleEvents(
    runtime: GameRuntime,
    handler: BridgeEncounterEngineEventHandler,
    events: EncounterEvent[],
): void {
    const persistenceSynchronizer =
        new BridgeEncounterPersistenceSynchronizer(
            runtime,
        );

    for (const event of events) {
        persistenceSynchronizer.syncEvent(event);
        handler.handle([event]);
    }
}
