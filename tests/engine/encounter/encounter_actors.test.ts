// tests/engine/encounter/encounter_actors.test.ts

import { describe, expect, it } from 'vitest';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { SHIPS } from '../../../src/engine/content/catalogs/ships';
import { ENCOUNTER_TEAM } from '../../../src/engine/defs/encounter_team';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_ID } from '../../../src/engine/defs/ship';
import { SHIP_WEAPON_PHASE } from '../../../src/engine/defs/ship_weapon';
import { ENCOUNTER_ACTOR_KIND } from '../../../src/engine/encounter/actors/encounter_actor';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';
import { createEncounterState } from '../../../src/engine/encounter/state/create_encounter_state';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
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

            team: ENCOUNTER_TEAM.NEUTRAL,
            weapons: [],
        });

        expect(actor).toEqual({
            id: 'ship_test_00',
            kind: ENCOUNTER_ACTOR_KIND.SHIP,

            displayName: SHIPS[SHIP_ID.GENERIC_00].name,

            team: ENCOUNTER_TEAM.NEUTRAL,

            anchorId: stationId,
            shipId: SHIP_ID.GENERIC_00,

            weapons: [],
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

                team: ENCOUNTER_TEAM.NEUTRAL,
                weapons: [],
            });
        }).toThrow('Cannot spawn ship actor: ' + 'anchor not found: missing_anchor');

        store.spawnShipActor({
            actorId: 'ship_test_00',
            shipId: SHIP_ID.GENERIC_00,
            anchorId: stationId,

            team: ENCOUNTER_TEAM.NEUTRAL,
            weapons: [],
        });

        expect(() => {
            store.spawnShipActor({
                actorId: 'ship_test_00',
                shipId: SHIP_ID.GENERIC_00,
                anchorId: stationId,

                team: ENCOUNTER_TEAM.NEUTRAL,
                weapons: [],
            });
        }).toThrow('Encounter actor already exists: ' + 'ship_test_00');
    });

    it('copies persistent node ship loadout into the loaded encounter snapshot', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const nodeActor = ShipNodeActorFactory.create({
            id: 'ship_generic_00',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

            anchorId: stationId,
        });

        const initialAmmoCount = nodeActor.weapons[0].ammoCount;

        node.actors.push(nodeActor);

        const engine = new EncounterEngine({
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

                anchorId: stationId,
            },
        });

        const [event] = engine.drainEvents();

        expect(event).toEqual(
            expect.objectContaining({
                type: ENCOUNTER_EVENT.ENCOUNTER_LOADED,

                state: expect.objectContaining({
                    actors: [
                        {
                            id: nodeActor.id,

                            kind: ENCOUNTER_ACTOR_KIND.SHIP,

                            displayName: SHIPS[nodeActor.shipId].name,

                            team: nodeActor.team,

                            anchorId: nodeActor.anchorId,

                            shipId: nodeActor.shipId,

                            weapons: [
                                {
                                    ...nodeActor.weapons[0],
                                },
                            ],
                        },
                    ],
                }),
            }),
        );

        if (event.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
            throw new Error(`Expected encounter loaded event, received: ` + `${event.type}`);
        }

        const encounterActor = event.state.actors[0];

        expect(encounterActor.weapons).not.toBe(nodeActor.weapons);

        expect(encounterActor.weapons[0]).not.toBe(nodeActor.weapons[0]);

        encounterActor.weapons[0].ammoCount = 4;

        encounterActor.weapons[0].phase = SHIP_WEAPON_PHASE.COOLDOWN;

        expect(nodeActor.weapons[0].ammoCount).toBe(initialAmmoCount);

        expect(nodeActor.weapons[0].phase).toBe(SHIP_WEAPON_PHASE.READY);
    });
});
