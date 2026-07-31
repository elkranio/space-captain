// tests/engine/encounter/shield_generator_regeneration.test.ts

import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('ShieldGeneratorRunner', () => {
    it('regenerates charges sequentially and preserves partial progress', () => {
        const engine = createEngine({
            charges: 0,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 0,
        });

        engine.step(19999);

        expect(engine.getShieldGeneratorState()).toEqual({
            charges: 0,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 19999,
        });

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED,

                shieldGenerator: {
                    charges: 0,
                    maxCharges: 3,

                    chargeRegenerationDurationMs: 20000,
                    chargeRegenerationElapsedMs: 19999,
                },
            },
        ]);

        engine.step(1);

        expect(engine.getShieldGeneratorState()).toEqual({
            charges: 1,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 0,
        });

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED,

                shieldGenerator: {
                    charges: 1,
                    maxCharges: 3,

                    chargeRegenerationDurationMs: 20000,
                    chargeRegenerationElapsedMs: 0,
                },
            },
        ]);

        // Большой step восстанавливает charges по очереди,
        // а не запускает три параллельных таймера.
        engine.step(25000);

        expect(engine.getShieldGeneratorState()).toEqual({
            charges: 2,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 5000,
        });

        engine.drainEvents();

        engine.step(15000);

        expect(engine.getShieldGeneratorState()).toEqual({
            charges: 3,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 0,
        });

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED,

                shieldGenerator: {
                    charges: 3,
                    maxCharges: 3,

                    chargeRegenerationDurationMs: 20000,
                    chargeRegenerationElapsedMs: 0,
                },
            },
        ]);

        engine.step(60000);

        expect(engine.getShieldGeneratorState()).toEqual({
            charges: 3,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 0,
        });

        expect(engine.drainEvents()).toEqual([]);
    });

    it('does nothing without a shield generator', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const engine = new EncounterEngine({
            drive: createShipDriveFixture(),
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                anchorId: stationId,
            },

            pointDefense: createPointDefenseFixture(),
        });

        engine.drainEvents();
        engine.step(60000);

        expect(engine.getShieldGeneratorState()).toBeUndefined();
        expect(engine.drainEvents()).toEqual([]);
    });
});

function createEngine(shieldGenerator: {
    charges: number;
    maxCharges: number;

    chargeRegenerationDurationMs: number;
    chargeRegenerationElapsedMs: number;
}): EncounterEngine {
    const { node, stationId } = createSingleStationNodeFixture();

    const engine = new EncounterEngine({
        drive: createShipDriveFixture(),
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: stationId,
        },

        pointDefense: createPointDefenseFixture(),
        shieldGenerator,
    });

    engine.drainEvents();

    return engine;
}
