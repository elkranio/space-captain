// tests/engine/content/new_game_universe_factory.test.ts

import { describe, expect, it } from 'vitest';
import NewGameUniverseFactory from '../../../src/engine/content/new_game/NewGameUniverseFactory';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_LOCATION_KIND, PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SPACE_BACKGROUND_ID } from '../../../src/engine/defs/space_background';
import {
    STICKY_MINE_ID,
} from '../../../src/engine/defs/sticky_mine';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import { SPACE_ANCHOR_KIND, SPACE_NODE_ACTOR_KIND } from '../../../src/engine/defs/universe';

describe('NewGameUniverseFactory', () => {
    it('creates a connected new game universe and dev player locations', () => {
        const generated = NewGameUniverseFactory.create();

        expect(generated.universe.nodes).toHaveLength(2);

        const [startNode, stationNode] = generated.universe.nodes;

        expect(startNode.id).toBe('node_start');

        expect(startNode.position).toEqual({
            x: 0,
            y: 0,
        });

        expect(startNode.spaceBackgroundId).toBe(SPACE_BACKGROUND_ID.NEBULA_00);

        expect(stationNode.id).toBe('node_station');

        expect(stationNode.position).toEqual({
            x: 100,
            y: 0,
        });

        expect(stationNode.spaceBackgroundId).toBe(SPACE_BACKGROUND_ID.NEBULA_00);

        const navigationBeaconAnchor = startNode.anchors.find((anchor) => {
            return anchor.kind === SPACE_ANCHOR_KIND.NAVIGATION_BEACON;
        });

        if (!navigationBeaconAnchor || navigationBeaconAnchor.kind !== SPACE_ANCHOR_KIND.NAVIGATION_BEACON) {
            throw new Error('Expected start navigation beacon anchor');
        }

        expect(navigationBeaconAnchor.localPosition).toEqual({
            x: 0,
            y: 0,
            z: 0,
        });

        expect(startNode.arrivalAnchorId).toBe(navigationBeaconAnchor.beacon.id);

        const asteroidAnchor = startNode.anchors.find((anchor) => {
            return anchor.kind === SPACE_ANCHOR_KIND.ASTEROID;
        });

        if (!asteroidAnchor || asteroidAnchor.kind !== SPACE_ANCHOR_KIND.ASTEROID) {
            throw new Error('Expected start asteroid anchor');
        }

        expect(asteroidAnchor.localPosition).toEqual({
            x: 900,
            y: 220,
            z: 1400,
        });

        const startStationAnchor = startNode.anchors.find((anchor) => {
            return anchor.kind === SPACE_ANCHOR_KIND.STATION;
        });

        if (!startStationAnchor || startStationAnchor.kind !== SPACE_ANCHOR_KIND.STATION) {
            throw new Error('Expected start station anchor');
        }

        expect(startStationAnchor.localPosition).toEqual({
            x: -900,
            y: 220,
            z: -1400,
        });

        const stationNodeAnchor = stationNode.anchors.find((anchor) => {
            return anchor.kind === SPACE_ANCHOR_KIND.STATION;
        });

        if (!stationNodeAnchor || stationNodeAnchor.kind !== SPACE_ANCHOR_KIND.STATION) {
            throw new Error('Expected station node anchor');
        }

        expect(stationNodeAnchor.localPosition).toEqual({
            x: 0,
            y: 0,
            z: 0,
        });

        // Обе ноды ссылаются на одну
        // сгенерированную станцию.
        expect(startStationAnchor.station).toBe(stationNodeAnchor.station);

        expect(stationNode.arrivalAnchorId).toBe(stationNodeAnchor.station.id);

        expect(startNode.actors).toHaveLength(1);

        const [enemy] = startNode.actors;

        expect(enemy.id).toBe('ship_generic_00');
        expect(enemy.kind).toBe(SPACE_NODE_ACTOR_KIND.SHIP);
        expect(enemy.anchorId).toBe(navigationBeaconAnchor.beacon.id);

        expect(enemy.weapons).toEqual([
            {
                id:
                    'sticky_mine_dispenser_00',

                weaponId:
                    SHIP_WEAPON_ID
                        .STICKY_MINE_DISPENSER_00,

                kind:
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER,

                loadedMineId:
                    STICKY_MINE_ID.BASIC_00,

                ammoCount: 6,

                phase:
                    SHIP_WEAPON_PHASE.READY,
                phaseElapsedMs: 0,

                dispensedMineCount: 0,
            },
        ]);

        expect(enemy.crewRoles).toEqual([
            OFFICER_ROLE.SCIENCE,
            OFFICER_ROLE.HELM,
            OFFICER_ROLE.WEAPONS,
            OFFICER_ROLE.ENGINEER,
        ]);

        expect(generated.playerLocations.arrivingAtStart).toEqual({
            kind: PLAYER_LOCATION_KIND.SPACE,

            nodeId: startNode.id,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ARRIVING,
                targetAnchorId: navigationBeaconAnchor.beacon.id,
            },
        });

        expect(generated.playerLocations.travellingToStart).toEqual({
            kind: PLAYER_LOCATION_KIND.SPACE,

            nodeId: startNode.id,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING,
                fromAnchorId: asteroidAnchor.asteroid.id,
                targetAnchorId: navigationBeaconAnchor.beacon.id,
            },
        });

        expect(generated.playerLocations.arrivingAtStation).toEqual({
            kind: PLAYER_LOCATION_KIND.SPACE,

            nodeId: stationNode.id,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ARRIVING,
                targetAnchorId: stationNodeAnchor.station.id,
            },
        });
    });

    it('creates fresh mutable state on each call', () => {
        const first = NewGameUniverseFactory.create();

        const second = NewGameUniverseFactory.create();

        expect(first.universe).not.toBe(second.universe);
        expect(first.universe.nodes).not.toBe(second.universe.nodes);

        expect(first.universe.nodes[0]).not.toBe(second.universe.nodes[0]);

        expect(first.universe.nodes[0].actors[0]).not.toBe(second.universe.nodes[0].actors[0]);

        const firstEnemy = first.universe.nodes[0].actors[0];
        const secondEnemy = second.universe.nodes[0].actors[0];

        expect(firstEnemy.weapons).not.toBe(secondEnemy.weapons);

        expect(firstEnemy.weapons).toHaveLength(1);
        expect(secondEnemy.weapons).toHaveLength(1);

        expect(firstEnemy.weapons[0]).not.toBe(
            secondEnemy.weapons[0],
        );

        expect(firstEnemy.weapons).toEqual(
            secondEnemy.weapons,
        );

        expect(first.playerLocations.arrivingAtStart).not.toBe(second.playerLocations.arrivingAtStart);
    });
});
