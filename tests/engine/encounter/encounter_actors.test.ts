// tests/engine/encounter/encounter_actors.test.ts

import { describe, expect, it } from 'vitest';
import { SHIPS } from '../../../src/engine/content/ships';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_ID } from '../../../src/engine/defs/ship';
import { ENCOUNTER_ACTOR_KIND } from '../../../src/engine/encounter/actors/encounter_actor';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';
import { createEncounterState } from '../../../src/engine/encounter/state/create_encounter_state';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('encounter actors', () => {
    it('spawns a runtime ship separately from navigation anchors', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const state = createEncounterState(node, {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorId: stationId,
        });

        const store = new EncounterStateStore(state);

        expect(state.actors).toEqual([]);

        const actor = store.spawnShipActor({
            actorId: 'ship_test_00',
            shipId: SHIP_ID.GENERIC_00,
            anchorId: stationId,
        });

        expect(actor).toEqual({
            id: 'ship_test_00',
            kind: ENCOUNTER_ACTOR_KIND.SHIP,

            displayName: SHIPS[SHIP_ID.GENERIC_00].name,

            anchorId: stationId,
            shipId: SHIP_ID.GENERIC_00,
        });

        expect(store.findAnchorById(actor.id)).toBeUndefined();

        expect(store.findActorById(actor.id)).toEqual(actor);

        expect(store.getActorsAtAnchor(stationId)).toEqual([actor]);

        expect(store.getActorsAtAnchor('another_anchor')).toEqual([]);
    });

    it('rejects an unknown anchor and duplicate actor id', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const state = createEncounterState(node, {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorId: stationId,
        });

        const store = new EncounterStateStore(state);

        expect(() => {
            store.spawnShipActor({
                actorId: 'ship_missing_anchor',
                shipId: SHIP_ID.GENERIC_00,
                anchorId: 'missing_anchor',
            });
        }).toThrow('Cannot spawn ship actor: ' + 'anchor not found: missing_anchor');

        store.spawnShipActor({
            actorId: 'ship_test_00',
            shipId: SHIP_ID.GENERIC_00,
            anchorId: stationId,
        });

        expect(() => {
            store.spawnShipActor({
                actorId: 'ship_test_00',
                shipId: SHIP_ID.GENERIC_00,
                anchorId: stationId,
            });
        }).toThrow('Encounter actor already exists: ship_test_00');
    });
});
