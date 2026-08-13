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
    STICKY_MINE_ID,
} from '../../../src/engine/defs/sticky_mine';
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
            'assigns earliest mines by role priority without double-booking',
            () => {
                const {
                    engine,
                    state,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

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
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .CLEAR_STICKY_MINE,

                    role:
                        OFFICER_ROLE.ENGINEER,

                    mineId:
                        'mine_fast',

                    elapsedMs: 0,

                    durationMs:
                        CLEAR_DURATION_MS,
                });

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.SCIENCE
                    ],
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .CLEAR_STICKY_MINE,

                    role:
                        OFFICER_ROLE.SCIENCE,

                    mineId:
                        'mine_slow',

                    elapsedMs: 0,

                    durationMs:
                        CLEAR_DURATION_MS,
                });

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

                const debug =
                    engine
                        .getEnemyDebugSnapshots()[0];

                if (!debug) {
                    throw new Error(
                        'Expected enemy debug snapshot',
                    );
                }

                expect(
                    debug.roles.find(
                        (role) => {
                            return (
                                role.role ===
                                OFFICER_ROLE
                                    .ENGINEER
                            );
                        },
                    )?.task,
                ).toMatchObject({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .CLEAR_STICKY_MINE,

                    label:
                        'CLEAN mine_fast',

                    targetRemainingMs:
                        7000,

                    progress: {
                        elapsedMs: 0,

                        durationMs:
                            CLEAR_DURATION_MS,
                    },
                });

                engine.drainEvents();

                engine.step(
                    CLEAR_DURATION_MS,
                );

                expect(
                    state.combat
                        .stickyMines,
                ).toEqual([]);

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.ENGINEER
                    ],
                ).toBeUndefined();

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.SCIENCE
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
                                    .PLAYER_STICKY_MINE_RESOLVED
                            );
                        });

                expect(
                    clearedEvents,
                ).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            outcome:
                                PLAYER_STICKY_MINE_OUTCOME
                                    .CLEARED,

                            mine:
                                expect.objectContaining({
                                    id:
                                        'mine_fast',
                                }),
                        }),

                        expect.objectContaining({
                            outcome:
                                PLAYER_STICKY_MINE_OUTCOME
                                    .CLEARED,

                            mine:
                                expect.objectContaining({
                                    id:
                                        'mine_slow',
                                }),
                        }),
                    ]),
                );
            },
        );

        it(
            'falls back to Helm and loses a too-late clearing race',
            () => {
                const {
                    engine,
                    state,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

                targetActor.crewRoles = [
                    OFFICER_ROLE.HELM,
                    OFFICER_ROLE.WEAPONS,
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
                ).toMatchObject({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .CLEAR_STICKY_MINE,

                    mineId:
                        'mine_too_late',
                });

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.WEAPONS
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

            mineId:
                STICKY_MINE_ID.BASIC_00,

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
