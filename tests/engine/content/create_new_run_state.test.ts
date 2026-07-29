// tests/engine/content/create_new_run_state.test.ts

import { describe, expect, it } from 'vitest';
import { createNewRunState } from '../../../src/engine/content/new_game/create_new_run_state';

describe('createNewRunState', () => {
    it('creates the configured starting player ship', () => {
        const run = createNewRunState();

        expect(run.player.ship).toEqual({
            hull: 3,
            maxHull: 3,

            pointDefense: {
                charges: 4,
                maxCharges: 4,
            },

            weapons: [],
        });
    });

    it('creates independent mutable player ship state for each run', () => {
        const firstRun = createNewRunState();
        const secondRun = createNewRunState();

        firstRun.player.ship.hull = 1;
        firstRun.player.ship.pointDefense.charges = 0;

        expect(secondRun.player.ship).toEqual({
            hull: 3,
            maxHull: 3,

            pointDefense: {
                charges: 4,
                maxCharges: 4,
            },

            weapons: [],
        });
    });
});
