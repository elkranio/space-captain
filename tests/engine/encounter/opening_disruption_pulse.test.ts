// tests/engine/encounter/opening_disruption_pulse.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_DRIVE_STATUS,
} from '../../../src/engine/defs/ship_drive';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import {
    createPlayerHullFixture,
} from '../../fixtures/engine/player_hull_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe(
    'opening disruption pulse',
    () => {
        it(
            'does not disable the player drive when initial hostile ships engage',
            () => {
                const {
                    engine,
                } =
                    createEncounter(
                        ENCOUNTER_TEAM
                            .ENEMY,
                    );

                engine.drainEvents();

                engine
                    .engageHostileActors();

                expect(
                    engine
                        .getDriveState()
                        .status,
                ).toBe(
                    SHIP_DRIVE_STATUS
                        .ONLINE,
                );

                expect(
                    engine.drainEvents(),
                ).toEqual([]);
            },
        );

        it(
            'does not disable the player drive when a ship becomes hostile',
            () => {
                const {
                    engine,
                    actorId,
                } =
                    createEncounter(
                        ENCOUNTER_TEAM
                            .NEUTRAL,
                    );

                engine.drainEvents();

                engine.setActorTeam(
                    actorId,
                    ENCOUNTER_TEAM
                        .ENEMY,
                );

                expect(
                    engine
                        .getDriveState()
                        .status,
                ).toBe(
                    SHIP_DRIVE_STATUS
                        .ONLINE,
                );

                expect(
                    engine.drainEvents(),
                ).toEqual([]);
            },
        );
    },
);

function createEncounter(
    team:
        typeof ENCOUNTER_TEAM.ENEMY |
        typeof ENCOUNTER_TEAM.NEUTRAL,
): {
    engine: EncounterEngine;
    actorId: string;
} {
    const {
        node,
        stationId,
    } =
        createSingleStationNodeFixture();

    const actor =
        ShipNodeActorFactory.create({
            id:
                'ship_test_00',

            presetId:
                SHIP_NODE_ACTOR_PRESET_ID
                    .ENEMY_GENERIC_00,

            anchorId:
                stationId,
        });

    actor.team =
        team;

    actor.weapons = [];

    node.actors.push(
        actor,
    );

    return {
        engine:
            new EncounterEngine({
                playerHull:
                    createPlayerHullFixture(),

                node,

                navigation: {
                    kind:
                        PLAYER_SPACE_NAVIGATION_KIND
                            .ANCHORED,

                    anchorId:
                        stationId,
                },

                drive:
                    createShipDriveFixture(),
            }),

        actorId:
            actor.id,
    };
}
