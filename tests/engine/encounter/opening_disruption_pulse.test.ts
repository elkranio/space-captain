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
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
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
            'does not automatically use the pulse for an initial hostile actor',
            () => {
                const {
                    engine,
                } =
                    createEncounter(
                        ENCOUNTER_TEAM
                            .ENEMY,
                    );

                engine.drainEvents();

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
            'does not automatically use the pulse when an actor becomes hostile',
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

        it(
            'uses the opening disruption pulse once for a hostile actor',
            () => {
                const {
                    engine,
                    actorId,
                } =
                    createEncounter(
                        ENCOUNTER_TEAM
                            .ENEMY,
                    );

                engine.drainEvents();

                expect(
                    engine.tryUseOpeningDisruptionPulse(
                        actorId,
                    ),
                ).toBe(true);

                expect(
                    engine
                        .getDriveState()
                        .status,
                ).toBe(
                    SHIP_DRIVE_STATUS
                        .DISABLED,
                );

                expect(
                    engine.drainEvents(),
                ).toEqual([
                    expect.objectContaining({
                        type:
                            ENCOUNTER_EVENT
                                .PLAYER_SHIP_DRIVE_DISRUPTED,

                        sourceActorId:
                            actorId,
                    }),
                ]);

                expect(
                    engine.tryUseOpeningDisruptionPulse(
                        actorId,
                    ),
                ).toBe(false);

                expect(
                    engine.drainEvents(),
                ).toEqual([]);
            },
        );

        it(
            'can use the opening disruption pulse after an actor becomes hostile',
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
                    engine.tryUseOpeningDisruptionPulse(
                        actorId,
                    ),
                ).toBe(true);

                expect(
                    engine
                        .getDriveState()
                        .status,
                ).toBe(
                    SHIP_DRIVE_STATUS
                        .DISABLED,
                );

                expect(
                    engine.drainEvents(),
                ).toEqual([
                    expect.objectContaining({
                        type:
                            ENCOUNTER_EVENT
                                .PLAYER_SHIP_DRIVE_DISRUPTED,

                        sourceActorId:
                            actorId,
                    }),
                ]);
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
                random: () => 0.5,
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
