// tests/engine/encounter/enemy_captain_cadence.test.ts

import {
    createPlayerHullFixture,
} from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import EnemyBehaviorRunner from '../../../src/engine/encounter/combat/enemy/EnemyBehaviorRunner';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe(
    'Enemy captain cadence',
    () => {
        it(
            'takes the first decision immediately and starts at most one order per tick',
            () => {
                const {
                    actor,
                    runner,
                } =
                    createFixture(
                        () => 0.5,
                    );

                expect(
                    actor.decision
                        .decisionTickRemainingMs,
                ).toBe(0);

                runner.step(0);

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.WEAPONS
                    ],
                ).toMatchObject({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    weaponId:
                        'missile_launcher_00',
                });

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.SCIENCE
                    ],
                ).toBeUndefined();

                expect(
                    actor.decision
                        .decisionTickRemainingMs,
                ).toBe(1000);

                runner.step(999);

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.SCIENCE
                    ],
                ).toBeUndefined();

                expect(
                    actor.decision
                        .decisionTickRemainingMs,
                ).toBe(1);

                runner.step(1);

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.SCIENCE
                    ],
                ).toMatchObject({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    weaponId:
                        'spam_projector_00',
                });

                expect(
                    actor.decision
                        .decisionTickRemainingMs,
                ).toBe(1000);
            },
        );

        it(
            'does not catch up multiple captain ticks from one large engine delta',
            () => {
                const {
                    actor,
                    runner,
                } =
                    createFixture(
                        () => 0.5,
                    );

                runner.step(10000);

                expect(
                    Object.values(
                        actor.crewTasks,
                    ).filter(Boolean),
                ).toHaveLength(1);

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.WEAPONS
                    ],
                ).toBeDefined();

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.SCIENCE
                    ],
                ).toBeUndefined();

                expect(
                    actor.decision
                        .decisionTickRemainingMs,
                ).toBe(1000);
            },
        );

        it(
            'applies symmetric decision-tick wiggle when scheduling the next attempt',
            () => {
                const {
                    actor,
                    runner,
                } =
                    createFixture(
                        () => 0,
                    );

                runner.step(0);

                expect(
                    actor.decision
                        .decisionTickRemainingMs,
                ).toBe(750);
            },
        );
    },
);

function createFixture(
    random: () => number,
) {
    const {
        node,
        stationId,
    } =
        createSingleStationNodeFixture();

    node.actors.push(
        ShipNodeActorFactory.create({
            id:
                'ship_enemy_combat_00',

            presetId:
                SHIP_NODE_ACTOR_PRESET_ID
                    .ENEMY_COMBAT_00,

            anchorId:
                stationId,
        }),
    );

    const stateStore =
        EncounterStateStore
            .fromSpaceNode({
                node,

                navigation: {
                    kind:
                        PLAYER_SPACE_NAVIGATION_KIND
                            .ANCHORED,

                    anchorId:
                        stationId,
                },

                playerHull:
                    createPlayerHullFixture(),

                drive:
                    createShipDriveFixture(),
            });

    const state =
        stateStore.getState();

    const actor =
        state.actors[0];

    if (!actor) {
        throw new Error(
            'Expected enemy combat actor',
        );
    }

    const runner =
        new EnemyBehaviorRunner({
            state,

            emit:
                () => {},

            clearPlayerStickyMine:
                () => false,

            deployEnemyShield:
                () => {},

            applyInternalEffect:
                () => false,

            random,
        });

    return {
        actor,
        runner,
    };
}
