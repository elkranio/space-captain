// tests/engine/encounter/encounter_actors.test.ts

import { describe, expect, it } from 'vitest';
import { SHIPS } from '../../../src/engine/content/ships';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_ID } from '../../../src/engine/defs/ship';
import { ENCOUNTER_ACTOR_KIND } from '../../../src/engine/encounter/actors/encounter_actor';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';
import { createEncounterState } from '../../../src/engine/encounter/state/create_encounter_state';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import { SPACE_NODE_ACTOR_KIND } from '../../../src/engine/defs/universe';
import { MISSILE_GUIDANCE_KIND, MISSILE_ID } from '../../../src/engine/defs/missile';
import { SHIP_WEAPON_KIND } from '../../../src/engine/defs/ship_weapon';
import type { ShipSpaceNodeActorState } from '../../../src/engine/defs/universe';

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
            weapons: [],
        });

        expect(actor).toEqual({
            id: 'ship_test_00',
            kind: ENCOUNTER_ACTOR_KIND.SHIP,

            displayName: SHIPS[SHIP_ID.GENERIC_00].name,

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
                weapons: [],
            });
        }).toThrow('Cannot spawn ship actor: ' + 'anchor not found: missing_anchor');

        store.spawnShipActor({
            actorId: 'ship_test_00',
            shipId: SHIP_ID.GENERIC_00,
            anchorId: stationId,
            weapons: [],
        });

        expect(() => {
            store.spawnShipActor({
                actorId: 'ship_test_00',
                shipId: SHIP_ID.GENERIC_00,
                anchorId: stationId,
                weapons: [],
            });
        }).toThrow('Encounter actor already exists: ship_test_00');
    });

    it('copies persistent node ship loadout into the loaded encounter snapshot', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const nodeActor: ShipSpaceNodeActorState = {
            id: 'ship_generic_00',
            kind: SPACE_NODE_ACTOR_KIND.SHIP,

            shipId: SHIP_ID.GENERIC_00,
            anchorId: stationId,

            weapons: [
                {
                    id: 'missile_launcher_00',
                    kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

                    firmwareGuidanceKind: MISSILE_GUIDANCE_KIND.HEAT,
                    loadedMissileId: MISSILE_ID.HEAT_00,

                    ammoCount: 5,
                    ammoCapacity: 5,
                },
            ],
        };

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
                            id: 'ship_generic_00',
                            kind: ENCOUNTER_ACTOR_KIND.SHIP,

                            displayName: SHIPS[SHIP_ID.GENERIC_00].name,

                            anchorId: stationId,
                            shipId: SHIP_ID.GENERIC_00,

                            weapons: [
                                {
                                    id: 'missile_launcher_00',
                                    kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

                                    firmwareGuidanceKind: MISSILE_GUIDANCE_KIND.HEAT,
                                    loadedMissileId: MISSILE_ID.HEAT_00,

                                    ammoCount: 5,
                                    ammoCapacity: 5,
                                },
                            ],
                        },
                    ],
                }),
            }),
        );

        if (event.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
            throw new Error(`Expected encounter loaded event, received: ${event.type}`);
        }

        const encounterActor = event.state.actors[0];

        expect(encounterActor.weapons).not.toBe(nodeActor.weapons);
        expect(encounterActor.weapons[0]).not.toBe(nodeActor.weapons[0]);

        encounterActor.weapons[0].ammoCount = 4;

        expect(nodeActor.weapons[0].ammoCount).toBe(5);
    });
});
