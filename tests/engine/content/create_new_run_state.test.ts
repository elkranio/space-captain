// tests/engine/content/create_new_run_state.test.ts

import { describe, expect, it } from 'vitest';
import { createNewRunState } from '../../../src/engine/content/new_game/create_new_run_state';
import {
    SHIP_DRIVE_ID,
    SHIP_DRIVE_STATUS,
} from '../../../src/engine/defs/ship_drive';

describe('createNewRunState', () => {
    it('creates the configured starting player ship', () => {
        const run = createNewRunState();

        expect(run.player.ship).toEqual({
            hull: 3,
            maxHull: 3,

            drive: {
                id: 'drive_player_00',
                driveId:
                    SHIP_DRIVE_ID.BASIC_00,

                status:
                    SHIP_DRIVE_STATUS.ONLINE,
            },

            pointDefense: {
                charges: 4,
                maxCharges: 4,
            },

            shieldGenerator: {
                charges: 3,
                maxCharges: 3,

                chargeRegenerationDurationMs: 20000,
                chargeRegenerationElapsedMs: 0,
            },

            weapons: [],
        });
    });

    it('creates independent mutable player ship state for each run', () => {
        const firstRun = createNewRunState();
        const secondRun = createNewRunState();

        firstRun.player.ship.hull = 1;
        firstRun.player.ship.drive.status =
            SHIP_DRIVE_STATUS.DISABLED;
        firstRun.player.ship.pointDefense.charges = 0;
        firstRun.player.ship.shieldGenerator.charges = 0;
        firstRun.player.ship.shieldGenerator.chargeRegenerationElapsedMs = 10000;

        expect(secondRun.player.ship).toEqual({
            hull: 3,
            maxHull: 3,

            drive: {
                id: 'drive_player_00',
                driveId:
                    SHIP_DRIVE_ID.BASIC_00,

                status:
                    SHIP_DRIVE_STATUS.ONLINE,
            },

            pointDefense: {
                charges: 4,
                maxCharges: 4,
            },

            shieldGenerator: {
                charges: 3,
                maxCharges: 3,

                chargeRegenerationDurationMs: 20000,
                chargeRegenerationElapsedMs: 0,
            },

            weapons: [],
        });
    });
});
