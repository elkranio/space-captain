// tests/engine/encounter/new_game_enemy_defense_sandbox.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import NewGameUniverseFactory from '../../../src/engine/content/new_game/NewGameUniverseFactory';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    createPointDefenseFixture,
} from '../../fixtures/engine/point_defense_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';

describe('New-game enemy defense sandbox', () => {
    it('wires a fully crewed enemy without offensive weapons', () => {
        const generation =
            NewGameUniverseFactory.create();

        const startNode =
            generation.universe.nodes.find(
                (node) => {
                    return (
                        node.id ===
                        'node_start'
                    );
                },
            );

        if (!startNode) {
            throw new Error(
                'Expected new-game start node',
            );
        }

        const enemy = startNode.actors[0];

        if (!enemy) {
            throw new Error(
                'Expected new-game enemy ship',
            );
        }

        expect(enemy.weapons).toEqual([]);

        expect(enemy.crewRoles).toEqual([
            OFFICER_ROLE.SCIENCE,
            OFFICER_ROLE.HELM,
            OFFICER_ROLE.WEAPONS,
            OFFICER_ROLE.ENGINEER,
        ]);

        const engine = new EncounterEngine({
            playerHull: createPlayerHullFixture(),

            node: startNode,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    startNode.arrivalAnchorId,
            },

            drive:
                createShipDriveFixture(),

            pointDefense:
                createPointDefenseFixture(),

            random: () => 0,
        });

        const [loadedEvent] =
            engine.drainEvents();

        if (
            loadedEvent.type !==
            ENCOUNTER_EVENT.ENCOUNTER_LOADED
        ) {
            throw new Error(
                'Expected encounter loaded event',
            );
        }

        engine.step(60000);

        expect(
            engine
                .drainEvents()
                .filter((event) => {
                    return (
                        event.type ===
                        ENCOUNTER_EVENT
                            .PLAYER_SHIP_TARGETING_DETECTED
                    );
                }),
        ).toEqual([]);
    });
});
