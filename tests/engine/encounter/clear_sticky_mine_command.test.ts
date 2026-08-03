// tests/engine/encounter/clear_sticky_mine_command.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
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
    type OfficerRole,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    STICKY_MINE_ID,
} from '../../../src/engine/defs/sticky_mine';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    type StickyMineState,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import {
    createPointDefenseFixture,
} from '../../fixtures/engine/point_defense_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

const ALL_ROLES = Object.values(
    OFFICER_ROLE,
);

describe('CLEAR MINE command', () => {
    it('is available to every role and reserves mines by nearest fuse', () => {
        const {
            engine,
            state,
        } = createEngine();

        state.combat.stickyMines.push(
            createMine('mine_slow', 9000),

            createOutgoingMine(
                'mine_outgoing',
                1000,
            ),

            createMine('mine_urgent', 5000),
            createMine('mine_middle', 7000),
        );

        for (const role of ALL_ROLES) {
            expect(
                getClearMineCommand(
                    engine,
                    role,
                ),
            ).toEqual({
                commandId:
                    ENCOUNTER_OFFICER_COMMAND_ID
                        .CLEAR_STICKY_MINE,

                label: 'CLEAR MINE',

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND
                            .NONE,
                },

                targetLabel: 'STICKY MINES',
            });
        }

        executeClearMine(
            engine,
            OFFICER_ROLE.SCIENCE,
        );
        executeClearMine(
            engine,
            OFFICER_ROLE.HELM,
        );
        executeClearMine(
            engine,
            OFFICER_ROLE.WEAPONS,
        );

        const tasks = engine.getOfficerTasks();

        expect(
            findTaskMineId(
                tasks,
                OFFICER_ROLE.SCIENCE,
            ),
        ).toBe('mine_urgent');

        expect(
            findTaskMineId(
                tasks,
                OFFICER_ROLE.HELM,
            ),
        ).toBe('mine_middle');

        expect(
            findTaskMineId(
                tasks,
                OFFICER_ROLE.WEAPONS,
            ),
        ).toBe('mine_slow');

        expect(
            getClearMineCommand(
                engine,
                OFFICER_ROLE.ENGINEER,
            ),
        ).toBeUndefined();
    });

    it('clears reserved mines when the timed tasks complete', () => {
        const {
            engine,
            state,
        } = createEngine();

        state.combat.stickyMines.push(
            createMine('mine_urgent', 5000),
            createMine('mine_second', 7000),
        );

        executeClearMine(
            engine,
            OFFICER_ROLE.SCIENCE,
        );
        executeClearMine(
            engine,
            OFFICER_ROLE.HELM,
        );

        engine.drainEvents();

        engine.step(3000);

        expect(
            state.combat.stickyMines,
        ).toEqual([]);

        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);

        expect(
            engine.drainEvents(),
        ).toEqual([
            {
                type:
                    ENCOUNTER_EVENT
                        .OFFICER_TASK_ENDED,

                task: {
                    id: 'task_1',

                    kind:
                        OFFICER_TASK_KIND
                            .CLEAR_STICKY_MINE,

                    role: OFFICER_ROLE.SCIENCE,

                    sourceCommandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .CLEAR_STICKY_MINE,

                    mineId: 'mine_urgent',

                    label: 'CLEAR MINE',
                    showProgress: true,

                    durationMs: 3000,
                    elapsedMs: 3000,

                    canBeCancelledByPlayer:
                        true,
                    canBeInterruptedByDamage:
                        true,
                },

                outcome:
                    OFFICER_TASK_OUTCOME
                        .COMPLETED,

                result: {
                    kind:
                        OFFICER_TASK_RESULT_KIND
                            .STICKY_MINE_CLEARED,

                    mineId: 'mine_urgent',
                },
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .OFFICER_TASK_ENDED,

                task: {
                    id: 'task_2',

                    kind:
                        OFFICER_TASK_KIND
                            .CLEAR_STICKY_MINE,

                    role:
                        OFFICER_ROLE.HELM,

                    sourceCommandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .CLEAR_STICKY_MINE,

                    mineId: 'mine_second',

                    label: 'CLEAR MINE',
                    showProgress: true,

                    durationMs: 3000,
                    elapsedMs: 3000,

                    canBeCancelledByPlayer:
                        true,
                    canBeInterruptedByDamage:
                        true,
                },

                outcome:
                    OFFICER_TASK_OUTCOME
                        .COMPLETED,

                result: {
                    kind:
                        OFFICER_TASK_RESULT_KIND
                            .STICKY_MINE_CLEARED,

                    mineId: 'mine_second',
                },
            },
        ]);
    });

    it('cancels a sweep when its mine detonates and does not retarget', () => {
        const {
            engine,
            state,
        } = createEngine();

        state.combat.stickyMines.push(
            createMine('mine_urgent', 1000),
            createMine('mine_next', 5000),
        );

        executeClearMine(
            engine,
            OFFICER_ROLE.HELM,
        );

        engine.drainEvents();

        engine.step(1000);

        expect(
            engine.drainEvents(),
        ).toEqual([
            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine: createMine(
                    'mine_urgent',
                    0,
                ),

                appliedDamage: 1,
                remainingHull: 2,
                destroyed: false,
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .OFFICER_TASK_ENDED,

                task: {
                    id: 'task_1',

                    kind:
                        OFFICER_TASK_KIND
                            .CLEAR_STICKY_MINE,

                    role: OFFICER_ROLE.HELM,

                    sourceCommandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .CLEAR_STICKY_MINE,

                    mineId: 'mine_urgent',

                    label: 'CLEAR MINE',
                    showProgress: true,

                    durationMs: 3000,
                    elapsedMs: 1000,

                    canBeCancelledByPlayer:
                        true,
                    canBeInterruptedByDamage:
                        true,
                },

                outcome:
                    OFFICER_TASK_OUTCOME
                        .CANCELLED,
            },
        ]);

        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);

        expect(
            state.combat.stickyMines,
        ).toEqual([
            createMine('mine_next', 4000),
        ]);

        expect(
            getClearMineCommand(
                engine,
                OFFICER_ROLE.HELM,
            ),
        ).toBeDefined();
    });

    it('takes six real seconds while enemy spam halves task progress', () => {
        const {
            engine,
            state,
        } = createEngine({
            withSpam: true,
        });

        state.combat.stickyMines.push(
            createMine('mine_test', 20000),
        );

        const actor = state.actors[0];
        const projector = actor?.weapons[0];

        if (
            !projector ||
            projector.kind !==
                SHIP_WEAPON_KIND
                    .SPAM_PROJECTOR
        ) {
            throw new Error(
                'Expected spam projector',
            );
        }

        projector.phase =
            SHIP_WEAPON_PHASE.CHANNELING;
        projector.phaseElapsedMs = 0;
        projector.activeChannelId =
            'spam_channel_test';

        executeClearMine(
            engine,
            OFFICER_ROLE.WEAPONS,
        );

        engine.drainEvents();

        engine.step(3000);

        expect(
            engine.getOfficerTasks(),
        ).toEqual([
            expect.objectContaining({
                mineId: 'mine_test',
                elapsedMs: 1500,
            }),
        ]);

        expect(
            state.combat.stickyMines,
        ).toEqual([
            createMine('mine_test', 17000),
        ]);

        expect(
            engine.drainEvents(),
        ).toEqual([]);

        engine.step(3000);

        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);

        expect(
            state.combat.stickyMines,
        ).toEqual([]);

        expect(
            engine.drainEvents(),
        ).toEqual([
            expect.objectContaining({
                type:
                    ENCOUNTER_EVENT
                        .OFFICER_TASK_ENDED,

                outcome:
                    OFFICER_TASK_OUTCOME
                        .COMPLETED,

                result: {
                    kind:
                        OFFICER_TASK_RESULT_KIND
                            .STICKY_MINE_CLEARED,

                    mineId: 'mine_test',
                },
            }),
        ]);
    });
});

function createEngine({
    withSpam = false,
}: {
    withSpam?: boolean;
} = {}) {
    const {
        node,
        stationId,
    } = createSingleStationNodeFixture();

    if (withSpam) {
        node.actors.push(
            ShipNodeActorFactory.create({
                id: 'ship_enemy_spam',

                presetId:
                    SHIP_NODE_ACTOR_PRESET_ID
                        .ENEMY_GENERIC_SPAM_00,

                anchorId: stationId,
            }),
        );
    }

    const engine = new EncounterEngine({
        playerHull: createPlayerHullFixture(),

        drive: createShipDriveFixture(),
        node,

        navigation: {
            kind:
                PLAYER_SPACE_NAVIGATION_KIND
                    .ANCHORED,

            anchorId: stationId,
        },

        pointDefense:
            createPointDefenseFixture(),
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

    return {
        engine,
        state: loadedEvent.state,
    };
}

function executeClearMine(
    engine: EncounterEngine,
    role: OfficerRole,
): void {
    expect(
        engine.executeCommand({
            role,

            commandId:
                ENCOUNTER_OFFICER_COMMAND_ID
                    .CLEAR_STICKY_MINE,

            target: {
                kind:
                    OFFICER_COMMAND_TARGET_KIND
                        .NONE,
            },
        }),
    ).toEqual({
        status:
            OFFICER_COMMAND_EXECUTION_STATUS
                .EXECUTED,
    });
}

function getClearMineCommand(
    engine: EncounterEngine,
    role: OfficerRole,
) {
    return engine
        .getAvailableCommands(role)
        .find((command) => {
            return (
                command.commandId ===
                ENCOUNTER_OFFICER_COMMAND_ID
                    .CLEAR_STICKY_MINE
            );
        });
}

function findTaskMineId(
    tasks: ReturnType<
        EncounterEngine['getOfficerTasks']
    >,
    role: OfficerRole,
): string | undefined {
    const task = tasks.find((candidate) => {
        return candidate.role === role;
    });

    if (
        task?.kind !==
        OFFICER_TASK_KIND.CLEAR_STICKY_MINE
    ) {
        return undefined;
    }

    return task.mineId;
}

function createOutgoingMine(
    id: string,
    timeToDetonationMs: number,
): StickyMineState {
    return {
        id,

        mineId:
            STICKY_MINE_ID.BASIC_00,

        source: {
            kind:
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP,
        },

        sourceWeaponId:
            'player_dispenser',

        target: {
            kind:
                COMBAT_TARGET_KIND.ACTOR,

            actorId: 'ship_enemy_00',
        },

        timeToDetonationMs,
        initialTimeToDetonationMs: 20000,

        damage: 1,
    };
}

function createMine(
    id: string,
    timeToDetonationMs: number,
): StickyMineState {
    return {
        id,

        mineId:
            STICKY_MINE_ID.BASIC_00,

        source: {
            kind:
                COMBAT_SOURCE_KIND.ACTOR,

            actorId: 'ship_enemy_00',
        },

        sourceWeaponId:
            'sticky_mine_dispenser_00',

        target: {
            kind:
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP,
        },

        timeToDetonationMs,
        initialTimeToDetonationMs: 20000,

        damage: 1,
    };
}
