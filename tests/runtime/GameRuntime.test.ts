// tests/runtime/GameRuntime.test.ts

import { describe, expect, it } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';

describe('GameRuntime player ship hull', () => {
    it('creates a new run with full player ship state', () => {
        const runtime = new GameRuntime();

        expect(runtime.getCurrentRun().player.ship).toEqual({
            hull: 3,
            maxHull: 3,

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

describe('GameRuntime player point defense', () => {
    it('updates persistent point-defense charges', () => {
        const runtime = new GameRuntime();

        runtime.setPlayerShipPointDefenseCharges(3);

        expect(runtime.getCurrentRun().player.ship.pointDefense).toEqual({
            charges: 3,
            maxCharges: 4,
        });

        runtime.setPlayerShipPointDefenseCharges(0);

        expect(runtime.getCurrentRun().player.ship.pointDefense).toEqual({
            charges: 0,
            maxCharges: 4,
        });
    });

    it('rejects invalid point-defense charges', () => {
        const runtime = new GameRuntime();

        expect(() => {
            runtime.setPlayerShipPointDefenseCharges(-1);
        }).toThrow('Player point-defense charges ' + 'must be an integer between ' + '0 and 4: -1');

        expect(() => {
            runtime.setPlayerShipPointDefenseCharges(5);
        }).toThrow('Player point-defense charges ' + 'must be an integer between ' + '0 and 4: 5');

        expect(() => {
            runtime.setPlayerShipPointDefenseCharges(1.5);
        }).toThrow('Player point-defense charges ' + 'must be an integer between ' + '0 and 4: 1.5');
    });
});

describe('GameRuntime player shield generator', () => {
    it('updates persistent shield-generator runtime state', () => {
        const runtime = new GameRuntime();

        runtime.setPlayerShipShieldGeneratorState({
            charges: 1,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 7500,
        });

        expect(runtime.getCurrentRun().player.ship.shieldGenerator).toEqual({
            charges: 1,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 7500,
        });
    });

    it('rejects invalid shield-generator runtime state', () => {
        const runtime = new GameRuntime();

        expect(() => {
            runtime.setPlayerShipShieldGeneratorState({
                charges: 4,
                maxCharges: 3,

                chargeRegenerationDurationMs: 20000,
                chargeRegenerationElapsedMs: 0,
            });
        }).toThrow('Player shield-generator charges must be an integer between 0 and 3: 4');

        expect(() => {
            runtime.setPlayerShipShieldGeneratorState({
                charges: 2,
                maxCharges: 3,

                chargeRegenerationDurationMs: 20000,
                chargeRegenerationElapsedMs: 20000,
            });
        }).toThrow('Player shield-generator regeneration elapsed must be in [0, 20000): 20000');

        expect(() => {
            runtime.setPlayerShipShieldGeneratorState({
                charges: 3,
                maxCharges: 3,

                chargeRegenerationDurationMs: 20000,
                chargeRegenerationElapsedMs: 1,
            });
        }).toThrow('Fully charged player shield generator must have zero regeneration elapsed: 1');
    });
});
