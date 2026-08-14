// tests/engine/encounter/enemy_threat_timing_error.test.ts

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
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../../src/engine/encounter/model/combat';
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
    'Enemy threat timing error',
    () => {
        it(
            'can make a near-boundary impossible mine clear look reachable',
            () => {
                let randomCalls = 0;

                const {
                    actor,
                    runner,
                    state,
                } =
                    createFixture(
                        () => {
                            randomCalls += 1;
                            return 1;
                        },
                    );

                actor.behavior
                    .decisionTickWiggleMs = 0;

                actor.behavior
                    .threatTimingWiggleMs = 1000;

                addMine(
                    state,
                    actor.id,
                    2500,
                );

                runner.step(0);

                expect(
                    randomCalls,
                ).toBe(1);

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.HELM
                    ],
                ).toMatchObject({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .CLEAR_STICKY_MINE,

                    mineId:
                        'mine_timing_00',
                });
            },
        );

        it(
            'does not consume RNG or start the same impossible clear when timing wiggle is zero',
            () => {
                const {
                    actor,
                    runner,
                    state,
                } =
                    createFixture(
                        () => {
                            throw new Error(
                                'Timing RNG must not be called',
                            );
                        },
                    );

                actor.behavior
                    .decisionTickWiggleMs = 0;

                actor.behavior
                    .threatTimingWiggleMs = 0;

                addMine(
                    state,
                    actor.id,
                    2500,
                );

                runner.step(0);

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.HELM
                    ],
                ).toBeUndefined();
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

    actor.crewRoles = [
        OFFICER_ROLE.HELM,
    ];

    actor.crewTasks = {};
    actor.weapons = [];
    actor.defenseTurret =
        undefined;
    actor.shieldGenerator =
        undefined;
    actor.powerCore =
        undefined;

    const runner =
        new EnemyBehaviorRunner({
            state,

            emit:
                () => {},

            clearPlayerStickyMine:
                () => false,

            purgePlayerSpamChannel:
                () => false,

            random,
        });

    return {
        actor,
        runner,
        state,
    };
}

function addMine(
    state:
        ReturnType<
            EncounterStateStore[
                'getState'
            ]
        >,
    actorId: string,
    timeToDetonationMs: number,
): void {
    state.combat
        .stickyMines
        .push({
            id:
                'mine_timing_00',

            source: {
                kind:
                    COMBAT_SOURCE_KIND
                        .PLAYER_SHIP,
            },

            sourceWeaponId:
                'sticky_mine_dispenser_player_00',

            target: {
                kind:
                    COMBAT_TARGET_KIND
                        .ACTOR,

                actorId,
            },

            timeToDetonationMs,

            initialTimeToDetonationMs:
                timeToDetonationMs,

            damage: 1,
        });
}
