// tests/app/BridgeEncounterDriveSync.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../src/engine/defs/player_location';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import {
    SHIP_DRIVE_ID,
    SHIP_DRIVE_STATUS,
} from '../../src/engine/defs/ship_drive';
import {
    ENCOUNTER_EVENT,
} from '../../src/engine/encounter/model/event';

describe('Bridge encounter drive sync', () => {
    it('persists encounter drive state in GameRuntime', () => {
        const runtime = new GameRuntime();
        const emit = vi.fn();

        const handler =
            new BridgeEncounterEngineEventHandler(
                {
                    emit,
                } as unknown as BridgeEventBus,

                vi.fn(),
                runtime,
            );

        handler.handle([
            {
                type:
                    ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_STATE_CHANGED,

                drive: {
                    id: 'drive_player_00',
                    driveId:
                        SHIP_DRIVE_ID.BASIC_00,

                    status:
                        SHIP_DRIVE_STATUS.DISABLED,
                },
            },
        ]);

        expect(
            runtime.getCurrentRun().player.ship.drive,
        ).toEqual({
            id: 'drive_player_00',
            driveId:
                SHIP_DRIVE_ID.BASIC_00,

            status:
                SHIP_DRIVE_STATUS.DISABLED,
        });

        // Presentation добавим отдельным атомом.
        expect(emit).not.toHaveBeenCalled();
    });
    it('persists disruption and interrupted navigation', () => {
        const runtime = new GameRuntime();
        const emit = vi.fn();

        const handler =
            new BridgeEncounterEngineEventHandler(
                {
                    emit,
                } as unknown as BridgeEventBus,

                vi.fn(),
                runtime,
            );

        handler.handle([
            {
                type:
                    ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,

                sourceActorId: 'ship_enemy_00',

                drive: {
                    id: 'drive_player_00',
                    driveId:
                        SHIP_DRIVE_ID.BASIC_00,

                    status:
                        SHIP_DRIVE_STATUS.DISABLED,
                },

                navigation: {
                    kind:
                        PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                    anchorId: 'anchor_safe_00',
                },
            },
        ]);

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

        // Presentation добавим отдельным атомом.
        expect(emit).not.toHaveBeenCalled();
    });
});
