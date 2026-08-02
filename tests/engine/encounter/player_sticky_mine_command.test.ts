// tests/engine/encounter/player_sticky_mine_command.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    createNewRunState,
} from '../../../src/engine/content/new_game/create_new_run_state';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    STICKY_MINE_ID,
} from '../../../src/engine/defs/sticky_mine';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type StickyMineDispenserState,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import type {
    ShipEncounterActorState,
} from '../../../src/engine/encounter/actors/ship/ship_encounter_actor';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_STICKY_MINE_OUTCOME,
    type StickyMineState,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import type {
    EncounterState,
} from '../../../src/engine/encounter/model/state';

describe('Player sticky-mine command', () => {
    it('launches one immediate three-mine salvo and keeps Weapons busy until the final launch', () => {
        const {
            engine,
            dispenser,
            target,
        } = createStickyMineTestSetup();

        target.hull = 3;
        

        const [command] =
            getStickyMineCommands(
                engine,
            );

        if (!command) {
            throw new Error(
                'Expected FIRE MINES command',
            );
        }

        expect(command).toMatchObject({
            commandId:
                ENCOUNTER_OFFICER_COMMAND_ID
                    .WEAPONS_FIRE_STICKY_MINES,

            label: 'FIRE MINES',

            target: {
                kind:
                    OFFICER_COMMAND_TARGET_KIND
                        .ACTOR,

                actorId: target.id,
            },
        });

        expect(
            engine.executeCommand({
                role:
                    OFFICER_ROLE.WEAPONS,

                commandId:
                    command.commandId,

                target:
                    command.target,
            }),
        ).toEqual({
            status:
                OFFICER_COMMAND_EXECUTION_STATUS
                    .EXECUTED,
        });

        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.DISPENSING,
        );
        expect(dispenser.ammoCount).toBe(6);
        expect(
            dispenser.dispensedMineCount,
        ).toBe(0);

        const [task] =
            engine.getOfficerTasks();

        expect(task).toMatchObject({
            kind:
                OFFICER_TASK_KIND
                    .WEAPONS_FIRE_STICKY_MINES,

            role:
                OFFICER_ROLE.WEAPONS,

            sourceCommandId:
                ENCOUNTER_OFFICER_COMMAND_ID
                    .WEAPONS_FIRE_STICKY_MINES,

            weaponId:
                dispenser.id,

            targetActorId:
                target.id,

            label: 'MINE SALVO',
            showProgress: false,

            durationMs: null,

            canBeCancelledByPlayer: false,
            canBeInterruptedByDamage: true,

            elapsedMs: 0,
        });

        if (!task) {
            throw new Error(
                'Expected sticky-mine task',
            );
        }

        expect(() => {
            engine.cancelTask(task.id);
        }).toThrow(
            'Officer task cannot be cancelled by player',
        );

        engine.step(0);

        expect(
            engine.drainEvents(),
        ).toContainEqual(
            expect.objectContaining({
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_STICKY_MINE_ATTACHED,

                mine:
                    expect.objectContaining({
                        source: {
                            kind:
                                COMBAT_SOURCE_KIND
                                    .PLAYER_SHIP,
                        },

                        target: {
                            kind:
                                COMBAT_TARGET_KIND.ACTOR,

                            actorId:
                                target.id,
                        },

                        initialTimeToDetonationMs:
                            7500,
                    }),
            }),
        );

        expect(
            engine.getOutgoingStickyMines(),
        ).toHaveLength(1);
        expect(dispenser.ammoCount).toBe(5);
        expect(
            dispenser.dispensedMineCount,
        ).toBe(1);
        expect(
            engine.getOfficerTasks(),
        ).toHaveLength(1);

        engine.step(1000);

        expect(
            engine.getOutgoingStickyMines(),
        ).toHaveLength(2);
        expect(dispenser.ammoCount).toBe(4);
        expect(
            dispenser.dispensedMineCount,
        ).toBe(2);
        expect(
            engine.getOfficerTasks(),
        ).toHaveLength(1);

        engine.step(1000);

        expect(
            engine.getOutgoingStickyMines()
                .map((mine) => {
                    return mine
                        .timeToDetonationMs;
                }),
        ).toEqual([
            5500,
            6500,
            7500,
        ]);

        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );
        expect(dispenser.ammoCount).toBe(3);
        expect(
            dispenser.dispensedMineCount,
        ).toBe(3);
        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);

        engine.drainEvents();

        engine.step(5500);

        expect(target.hull).toBe(2);
        expect(
            engine.getOutgoingStickyMines(),
        ).toHaveLength(2);

        engine.step(1000);

        expect(target.hull).toBe(1);
        expect(
            engine.getOutgoingStickyMines(),
        ).toHaveLength(1);

        engine.step(1000);

        expect(target.hull).toBe(0);
        expect(
            engine.getOutgoingStickyMines(),
        ).toEqual([]);

        const resolutionEvents =
            engine.drainEvents();

        expect(
            resolutionEvents
                .filter((event) => {
                    return (
                        event.type ===
                        ENCOUNTER_EVENT
                            .PLAYER_STICKY_MINE_RESOLVED
                    );
                })
                .map((event) => {
                    if (
                        event.type !==
                            ENCOUNTER_EVENT
                                .PLAYER_STICKY_MINE_RESOLVED ||
                        event.outcome !==
                            PLAYER_STICKY_MINE_OUTCOME
                                .DETONATED
                    ) {
                        throw new Error(
                            'Expected detonated player sticky mine',
                        );
                    }

                    return {
                        outcome:
                            event.outcome,

                        damage:
                            event.damage,

                        remainingHull:
                            event.remainingHull,
                    };
                }),
        ).toEqual([
            {
                outcome:
                    PLAYER_STICKY_MINE_OUTCOME
                        .DETONATED,

                damage: 1,
                remainingHull: 2,
            },
            {
                outcome:
                    PLAYER_STICKY_MINE_OUTCOME
                        .DETONATED,

                damage: 1,
                remainingHull: 1,
            },
            {
                outcome:
                    PLAYER_STICKY_MINE_OUTCOME
                        .DETONATED,

                damage: 1,
                remainingHull: 0,
            },
        ]);

        expect(
            resolutionEvents,
        ).toContainEqual({
            type:
                ENCOUNTER_EVENT
                    .ENEMY_SHIP_DESTROYED,

            actorId:
                target.id,
        });
    });

    it('preserves salvo launch ages when one large step launches the whole salvo', () => {
        const {
            engine,
            dispenser,
        } = createStickyMineTestSetup();

        executeStickyMineCommand(
            engine,
        );

        engine.step(2500);

        expect(
            engine.getOutgoingStickyMines()
                .map((mine) => {
                    return mine
                        .timeToDetonationMs;
                }),
        ).toEqual([
            5000,
            6000,
            7000,
        ]);

        expect(dispenser.ammoCount).toBe(3);
        expect(
            dispenser.dispensedMineCount,
        ).toBe(3);

        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );

        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);
    });

    it('launches a partial final salvo when fewer mines remain than salvo size', () => {
        const {
            engine,
            dispenser,
        } = createStickyMineTestSetup();

        dispenser.ammoCount = 2;

        executeStickyMineCommand(
            engine,
        );

        engine.step(0);
        engine.step(1000);

        expect(dispenser.ammoCount).toBe(0);
        expect(
            dispenser.dispensedMineCount,
        ).toBe(2);
        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );

        expect(
            engine.getOutgoingStickyMines(),
        ).toHaveLength(2);
        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);
    });

    it('returns to READY without spending ammunition when the target is lost before the first launch', () => {
        const {
            engine,
            dispenser,
            target,
        } = createStickyMineTestSetup();

        executeStickyMineCommand(
            engine,
        );

        engine.setActorTeam(
            target.id,
            ENCOUNTER_TEAM.NEUTRAL,
        );

        engine.step(0);

        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
        expect(dispenser.ammoCount).toBe(6);
        expect(
            dispenser.dispensedMineCount,
        ).toBe(0);

        expect(
            engine.getOutgoingStickyMines(),
        ).toEqual([]);
        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);
    });

    it('emits target lost and removes an attached outgoing mine when the actor stops being hostile', () => {
        const {
            engine,
            target,
        } = createStickyMineTestSetup();

        executeStickyMineCommand(
            engine,
        );

        engine.step(0);
        engine.drainEvents();

        engine.setActorTeam(
            target.id,
            ENCOUNTER_TEAM.NEUTRAL,
        );

        engine.step(0);

        expect(
            engine.getOutgoingStickyMines(),
        ).toEqual([]);

        expect(
            engine.drainEvents(),
        ).toContainEqual(
            expect.objectContaining({
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_STICKY_MINE_RESOLVED,

                outcome:
                    PLAYER_STICKY_MINE_OUTCOME
                        .TARGET_LOST,

                mine:
                    expect.objectContaining({
                        target: {
                            kind:
                                COMBAT_TARGET_KIND.ACTOR,

                            actorId:
                                target.id,
                        },
                    }),
            }),
        );
    });

    it('enters cooldown and preserves unlaunched ammunition when damage interrupts an active salvo', () => {
        const {
            engine,
            state,
            dispenser,
            target,
        } = createStickyMineTestSetup();

        executeStickyMineCommand(
            engine,
        );

        engine.step(0);
        engine.drainEvents();

        state.combat.stickyMines.push(
            createIncomingInterruptMine(
                target.id,
            ),
        );

        engine.step(0);

        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );
        expect(dispenser.ammoCount).toBe(5);
        expect(
            dispenser.dispensedMineCount,
        ).toBe(1);

        expect(
            engine.getOutgoingStickyMines(),
        ).toHaveLength(1);
        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);

        expect(
            engine.drainEvents(),
        ).toContainEqual(
            expect.objectContaining({
                type:
                    ENCOUNTER_EVENT
                        .OFFICER_TASK_ENDED,

                outcome:
                    OFFICER_TASK_OUTCOME
                        .CANCELLED,

                task:
                    expect.objectContaining({
                        kind:
                            OFFICER_TASK_KIND
                                .WEAPONS_FIRE_STICKY_MINES,
                    }),
            }),
        );
    });
});

function createStickyMineTestSetup(): {
    engine: EncounterEngine;
    state: EncounterState;

    dispenser:
        StickyMineDispenserState;

    target:
        ShipEncounterActorState;
} {
    const run =
        createNewRunState();

    const startNode =
        run.universe.nodes.find(
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

    const engine = new EncounterEngine({
        node: startNode,

        navigation: {
            kind:
                PLAYER_SPACE_NAVIGATION_KIND
                    .ANCHORED,

            anchorId:
                startNode.arrivalAnchorId,
        },

        drive:
            run.player.ship.drive,

        pointDefense:
            run.player.ship
                .pointDefense,

        shieldGenerator:
            run.player.ship
                .shieldGenerator,

        weapons:
            run.player.ship.weapons,
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

    const dispenser =
        loadedEvent.state
            .combat
            .playerWeapons
            .find((weapon) => {
                return (
                    weapon.kind ===
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER
                );
            });

    if (
        !dispenser ||
        dispenser.kind !==
            SHIP_WEAPON_KIND
                .STICKY_MINE_DISPENSER
    ) {
        throw new Error(
            'Expected player sticky-mine dispenser',
        );
    }

    const target =
        loadedEvent.state
            .actors
            .find((actor) => {
                return (
                    actor.team ===
                    ENCOUNTER_TEAM.ENEMY
                );
            });

    if (!target) {
        throw new Error(
            'Expected enemy target actor',
        );
    }

    return {
        engine,
        state:
            loadedEvent.state,

        dispenser,
        target,
    };
}

function executeStickyMineCommand(
    engine: EncounterEngine,
): void {
    const [command] =
        getStickyMineCommands(
            engine,
        );

    if (!command) {
        throw new Error(
            'Expected FIRE MINES command',
        );
    }

    expect(
        engine.executeCommand({
            role:
                OFFICER_ROLE.WEAPONS,

            commandId:
                command.commandId,

            target:
                command.target,
        }),
    ).toEqual({
        status:
            OFFICER_COMMAND_EXECUTION_STATUS
                .EXECUTED,
    });
}

function getStickyMineCommands(
    engine: EncounterEngine,
) {
    return engine
        .getAvailableCommands(
            OFFICER_ROLE.WEAPONS,
        )
        .filter((command) => {
            return (
                command.commandId ===
                ENCOUNTER_OFFICER_COMMAND_ID
                    .WEAPONS_FIRE_STICKY_MINES
            );
        });
}

function createIncomingInterruptMine(
    sourceActorId: string,
): StickyMineState {
    return {
        id:
            'incoming_interrupt_mine',

        mineId:
            STICKY_MINE_ID.BASIC_00,

        source: {
            kind:
                COMBAT_SOURCE_KIND.ACTOR,

            actorId:
                sourceActorId,
        },

        sourceWeaponId:
            'enemy_dispenser',

        target: {
            kind:
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP,
        },

        timeToDetonationMs: 0,
        initialTimeToDetonationMs: 7500,

        damage: 1,
    };
}
