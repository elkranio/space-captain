// tests/runtime/GameRuntime.test.ts
import { describe, expect, it } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';

describe('GameRuntime player ship hull', () => {
    it('creates a new run with full player ship hull', () => {
        const runtime = new GameRuntime();

        expect(runtime.getCurrentRun().player.ship).toEqual({
            hull: 3,
            maxHull: 3,
            weapons: [],
        });
    });

    it('damages player ship hull and clamps it at zero', () => {
        const runtime = new GameRuntime();

        expect(runtime.damagePlayerShipHull(1)).toEqual({
            previousHull: 3,
            currentHull: 2,
            destroyed: false,
        });

        expect(runtime.damagePlayerShipHull(10)).toEqual({
            previousHull: 2,
            currentHull: 0,
            destroyed: true,
        });

        expect(runtime.getCurrentRun().player.ship).toEqual({
            hull: 0,
            maxHull: 3,
            weapons: [],
        });
    });

    it('rejects non-positive player ship hull damage', () => {
        const runtime = new GameRuntime();

        expect(() => {
            runtime.damagePlayerShipHull(0);
        }).toThrow('Player ship hull damage must be positive: 0');

        expect(() => {
            runtime.damagePlayerShipHull(-1);
        }).toThrow('Player ship hull damage must be positive: -1');
    });
});
