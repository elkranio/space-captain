import { afterEach, describe, expect, it } from 'vitest';
import { DEBUG_START } from '../../../src/engine/content/catalogs/debug_start';
import { SHIPS } from '../../../src/engine/content/catalogs/ships';
import shipsData from '../../../src/engine/content/data/ships.json';
import { SHIPS_SCHEMA } from '../../../src/engine/content/schemas/ships';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { createEncounterState } from '../../../src/engine/encounter/state/create_encounter_state';
import { createNewRunState } from '../../../src/engine/generation/new_game/create_new_run_state';
import { createDebugStartPlayerShip } from '../../../src/engine/generation/new_game/debug_start_ship_factory';
import NewGameUniverseFactory from '../../../src/engine/generation/new_game/NewGameUniverseFactory';
import ShipFactory from '../../../src/engine/generation/ship/ShipFactory';

const startingShips = { ...DEBUG_START };
afterEach(() => Object.assign(DEBUG_START, startingShips));

describe('Reusable ship catalog', () => {
    it('preserves authored equipment instance IDs and placements for every build', () => {
        for (const [id, definition] of Object.entries(SHIPS_SCHEMA.parse(shipsData))) {
            const ship = ShipFactory.createFromPreset(SHIPS[id]);
            expect(ship.chassisId).toBe(definition.chassisId);
            expect(ship.mounts).toHaveLength(definition.equipment.length);
            for (const equipment of definition.equipment) {
                expect(ship.mounts).toContainEqual({ slotId: equipment.slotId, equipmentId: equipment.id });
            }
        }
    });

    it.each(Object.keys(SHIPS))('can use %s for both roles with independent runtime state', id => {
        DEBUG_START.playerShipId = id;
        DEBUG_START.enemyShipId = id;
        const run = createNewRunState();
        const generated = NewGameUniverseFactory.create();
        const node = generated.universe.nodes[0];
        const enemy = node.actors[0];
        const player = run.player.ship;
        expect(player).toEqual(ShipFactory.createFromPreset(SHIPS[id]));
        expect(enemy.chassisId).toBe(player.chassisId);
        expect(enemy.mounts).toEqual(player.mounts);
        expect(enemy.drive).not.toBe(player.drive);
        expect(enemy.weapons).toEqual(player.weapons);
        const original = createDebugStartPlayerShip();
        player.drive.id = 'changed';
        player.mounts[0].slotId = 'changed';
        expect(createDebugStartPlayerShip()).toEqual(original);
        expect(enemy.drive.id).toBe(original.drive.id);
        expect(enemy.mounts).toEqual(original.mounts);
        const engine = new EncounterEngine({
            node,
            navigation: generated.playerLocations.arrivingAtStart.navigation,
            playerShip: original,
            random: () => 0.5,
        });
        expect(() => engine.step(100)).not.toThrow();
    });

    it('starts a player encounter without optional defense, core or weapons', () => {
        const preset = Object.values(SHIPS)[0];
        const playerShip = ShipFactory.createFromPreset({
            id: 'bare_ship', chassisId: preset.chassisId, drive: preset.drive, weapons: [],
        });
        const generated = NewGameUniverseFactory.create();
        const input = {
            node: generated.universe.nodes[0],
            navigation: generated.playerLocations.arrivingAtStart.navigation,
            playerShip,
        };
        const state = createEncounterState(input);
        expect(state.combat.defenseTurret).toBeUndefined();
        expect(state.combat.shieldGenerator).toBeUndefined();
        expect(state.combat.powerCore).toBeUndefined();
        expect(state.combat.playerWeapons).toEqual([]);
        expect(state.playerMounts).toHaveLength(1);
        const engine = new EncounterEngine({ ...input, random: () => 0.5 });
        expect(() => engine.step(100)).not.toThrow();
    });
});
