// tests/engine/encounter/encounter_actors.test.ts

import { describe, expect, it } from 'vitest';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import type { EncounterActorState } from '../../../src/engine/encounter/actors/encounter_actor';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';
import { createEncounterState } from '../../../src/engine/encounter/state/create_encounter_state';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('encounter actors', () => {
    it('keeps runtime actors separate from navigation anchors', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const state = createEncounterState(node, {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorId: stationId,
        });

        expect(state.actors).toEqual([]);

        const actor: EncounterActorState = {
            id: 'actor_test_ship',
            displayName: 'TEST SHIP',
            anchorId: stationId,
        };

        state.actors.push(actor);

        const store = new EncounterStateStore(state);

        expect(store.findAnchorById(actor.id)).toBeUndefined();

        expect(store.findActorById(actor.id)).toEqual(actor);

        expect(store.getActorsAtAnchor(stationId)).toEqual([actor]);

        expect(store.getActorsAtAnchor('another_anchor')).toEqual([]);
    });
});
