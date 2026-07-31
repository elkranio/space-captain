// tests/engine/encounter/shield_generator_state.test.ts

import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Encounter shield generator state', () => {
    it('hydrates an independent snapshot from persistent player ship state', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const persistentShieldGenerator = {
            charges: 1,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 7500,
        };

        const engine = new EncounterEngine({
            drive: createShipDriveFixture(),
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                anchorId: stationId,
            },

            pointDefense: createPointDefenseFixture(),
            shieldGenerator: persistentShieldGenerator,
        });

        const [loadedEvent] = engine.drainEvents();

        if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
            throw new Error(`Expected encounter loaded event, received: ${loadedEvent.type}`);
        }

        expect(loadedEvent.state.combat.shieldGenerator).toEqual({
            charges: 1,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 7500,
        });

        expect(loadedEvent.state.combat.shieldGenerator).not.toBe(persistentShieldGenerator);

        if (!loadedEvent.state.combat.shieldGenerator) {
            throw new Error('Expected encounter shield generator');
        }

        loadedEvent.state.combat.shieldGenerator.charges = 0;
        loadedEvent.state.combat.shieldGenerator.chargeRegenerationElapsedMs = 10000;

        expect(persistentShieldGenerator).toEqual({
            charges: 1,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 7500,
        });

        expect(engine.getShieldGeneratorState()).toEqual({
            charges: 0,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 10000,
        });
    });

    it('supports a player ship without a shield generator', () => {
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

        const [loadedEvent] = engine.drainEvents();

        if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
            throw new Error(`Expected encounter loaded event, received: ${loadedEvent.type}`);
        }

        expect(loadedEvent.state.combat).not.toHaveProperty('shieldGenerator');
        expect(engine.getShieldGeneratorState()).toBeUndefined();
    });
});
