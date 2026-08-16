// tests/engine/encounter/enemy_sticky_mine_clearing.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/defs/officer_task';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_STICKY_MINE_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import {
    createAnchoredPlayerCombatTestSetup,
    type AnchoredPlayerCombatTestSetup,
} from './combat_test_support';

const CLEAR_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .CLEAR_STICKY_MINE,
    );

describe(
    'Enemy sticky-mine clearing',
    () => {
        it(
            'keeps mine clearing Engineer-only while another mine waits',
            () => {
                const {
                    engine,
                    state,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup({
                        random:
                            () => 0.5,
                    });

                targetActor.crewRoles = [
                    OFFICER_ROLE.WEAPONS,
                    OFFICER_ROLE.HELM,
                    OFFICER_ROLE.SCIENCE,
                    OFFICER_ROLE.ENGINEER,
                ];

                targetActor.weapons = [];
                targetActor.defenseTurret =
                    undefined;

                const initialHull =
                    targetActor.hull;

                addPlayerMine({
                    setup: {
                        engine,
                        state,
                        targetActor,
                    },

                    id: 'mine_slow',
                    timeToDetonationMs:
                        9000,
                });

                addPlayerMine({
                    setup: {
                        engine,
                        state,
                        targetActor,
                    },

                    id: 'mine_fast',
                    timeToDetonationMs:
                        7000,
                });

                engine.step(0);

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.ENGINEER
                    ],
                ).toMatchObject({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .CLEAR_STICKY_MINE,

                    role:
                        OFFICER_ROLE.ENGINEER,

                    mineId:
                        'mine_fast',
                });

                engine.step(
                    targetActor.behavior
                        .decisionTickDurationMs,
                );

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.SCIENCE
                    ],
                ).toBeUndefined();

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.HELM
                    ],
                ).toBeUndefined();

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.WEAPONS
                    ],
                ).toBeUndefined();

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.ENGINEER
                    ],
                ).toMatchObject({
                    mineId:
                        'mine_fast',
                });

                engine.drainEvents();

                engine.step(
                    CLEAR_DURATION_MS,
                );

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.SCIENCE
                    ],
                ).toBeUndefined();

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.HELM
                    ],
                ).toBeUndefined();

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.WEAPONS
                    ],
                ).toBeUndefined();

                expect(
                    targetActor.hull,
                ).toBe(initialHull);

                const clearedEvents =
                    engine
                        .drainEvents()
                        .filter((event) => {
                            return (
                                event.type ===
                                ENCOUNTER_EVENT
                                    .PLAYER_STICKY_MINE_RESOLVED &&
                                event.outcome ===
                                PLAYER_STICKY_MINE_OUTCOME
                                    .CLEARED
                            );
                        });

                expect(
                    clearedEvents,
                ).toContainEqual(
                    expect.objectContaining({
                        mine:
                            expect.objectContaining({
                                id:
                                    'mine_fast',
                            }),
                    }),
                );
            },
        );

        it(
            'does not knowingly start a too-late clearing race',
            () => {
                const {
                    engine,
                    state,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

                targetActor.behavior
                    .decisionTickWiggleMs = 0;

                targetActor.behavior
                    .threatTimingWiggleMs = 0;

                targetActor.crewRoles = [
                    OFFICER_ROLE.ENGINEER,
                ];

                targetActor.weapons = [];
                targetActor.defenseTurret =
                    undefined;

                const initialHull =
                    targetActor.hull;

                addPlayerMine({
                    setup: {
                        engine,
                        state,
                        targetActor,
                    },

                    id:
                        'mine_too_late',

                    timeToDetonationMs:
                        1000,
                });

                engine.step(0);

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.HELM
                    ],
                ).toBeUndefined();

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.WEAPONS
                    ],
                ).toBeUndefined();

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.ENGINEER
                    ],
                ).toBeUndefined();

                engine.drainEvents();

                engine.step(1000);

                expect(
                    state.combat
                        .stickyMines,
                ).toEqual([]);

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.HELM
                    ],
                ).toBeUndefined();

                expect(
                    targetActor.hull,
                ).toBe(
                    initialHull - 1,
                );

                expect(
                    engine.drainEvents(),
                ).toContainEqual(
                    expect.objectContaining({
                        type:
                            ENCOUNTER_EVENT
                                .PLAYER_STICKY_MINE_RESOLVED,

                        outcome:
                            PLAYER_STICKY_MINE_OUTCOME
                                .DETONATED,

                        mine:
                            expect.objectContaining({
                                id:
                                    'mine_too_late',
                            }),
                    }),
                );
            },
        );
    },
);

function addPlayerMine({
    setup,
    id,
    timeToDetonationMs,
}: {
    setup:
        AnchoredPlayerCombatTestSetup;

    id: string;
    timeToDetonationMs: number;
}): void {
    setup.state.combat
        .stickyMines
        .push({
            id,


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

                actorId:
                    setup.targetActor.id,
            },

            timeToDetonationMs,

            initialTimeToDetonationMs:
                timeToDetonationMs,

            damage: 1,
        });
}
