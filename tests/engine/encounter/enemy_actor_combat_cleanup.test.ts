// tests/engine/encounter/enemy_actor_combat_cleanup.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    createNewRunState,
} from '../../../src/engine/content/new_game/create_new_run_state';
import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_MISSILE_OUTCOME,
    PLAYER_STICKY_MINE_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';

describe('Enemy actor combat cleanup', () => {
    it('resolves remaining player missiles and mines before the enemy destruction event', () => {
        const {
            engine,
            state,
            targetActorId,
        } = createCombatCleanupTestSetup();

        executeWeaponsCommand(
            engine,
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_MISSILE,
        );

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS,
        );

        expect(
            engine
                .getOutgoingMissileProjectiles(),
        ).toHaveLength(1);

        executeWeaponsCommand(
            engine,
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_STICKY_MINES,
        );

        engine.step(0);
        engine.step(1000);
        engine.step(1000);

        expect(
            engine.getOutgoingStickyMines(),
        ).toHaveLength(3);

        const target =
            state.actors.find((actor) => {
                return (
                    actor.id ===
                    targetActorId
                );
            });

        if (!target) {
            throw new Error(
                'Expected live enemy target',
            );
        }

        target.hull = 1;

        const killerMine =
            state.combat.stickyMines.find(
                (mine) => {
                    return (
                        mine.source.kind ===
                            COMBAT_SOURCE_KIND
                                .PLAYER_SHIP &&
                        mine.target.kind ===
                            COMBAT_TARGET_KIND
                                .ACTOR &&
                        mine.target.actorId ===
                            targetActorId
                    );
                },
            );

        if (!killerMine) {
            throw new Error(
                'Expected outgoing sticky mine',
            );
        }

        killerMine.timeToDetonationMs = 0;

        engine.drainEvents();
        engine.step(0);

        expect(
            engine
                .getOutgoingMissileProjectiles(),
        ).toEqual([]);

        expect(
            engine.getOutgoingStickyMines(),
        ).toEqual([]);

        expect(
            state.actors.some((actor) => {
                return (
                    actor.id ===
                    targetActorId
                );
            }),
        ).toBe(false);

        const events =
            engine.drainEvents();

        const lethalResolutionIndex =
            events.findIndex((event) => {
                return (
                    event.type ===
                        ENCOUNTER_EVENT
                            .PLAYER_STICKY_MINE_RESOLVED &&
                    event.outcome ===
                        PLAYER_STICKY_MINE_OUTCOME
                            .DETONATED
                );
            });

        const destructionIndex =
            events.findIndex((event) => {
                return (
                    event.type ===
                    ENCOUNTER_EVENT
                        .ENEMY_SHIP_DESTROYED
                );
            });

        const missileTargetLossIndexes =
            events.flatMap(
                (event, index) => {
                    return (
                        event.type ===
                            ENCOUNTER_EVENT
                                .PLAYER_MISSILE_RESOLVED &&
                        event.outcome ===
                            PLAYER_MISSILE_OUTCOME
                                .TARGET_LOST
                    )
                        ? [index]
                        : [];
                },
            );

        const mineTargetLossIndexes =
            events.flatMap(
                (event, index) => {
                    return (
                        event.type ===
                            ENCOUNTER_EVENT
                                .PLAYER_STICKY_MINE_RESOLVED &&
                        event.outcome ===
                            PLAYER_STICKY_MINE_OUTCOME
                                .TARGET_LOST
                    )
                        ? [index]
                        : [];
                },
            );

        expect(
            lethalResolutionIndex,
        ).toBeGreaterThanOrEqual(0);

        expect(
            destructionIndex,
        ).toBeGreaterThan(
            lethalResolutionIndex,
        );

        expect(
            missileTargetLossIndexes,
        ).toHaveLength(1);

        expect(
            mineTargetLossIndexes,
        ).toHaveLength(2);

        for (
            const index of [
                ...missileTargetLossIndexes,
                ...mineTargetLossIndexes,
            ]
        ) {
            expect(index).toBeGreaterThan(
                lethalResolutionIndex,
            );

            expect(index).toBeLessThan(
                destructionIndex,
            );
        }
    });
});

function createCombatCleanupTestSetup() {
    const run =
        createNewRunState();

    const startNode =
        run.universe.nodes.find((node) => {
            return node.id === 'node_start';
        });

    if (!startNode) {
        throw new Error(
            'Expected new-game start node',
        );
    }

    const engine =
        new EncounterEngine({
            node:
                startNode,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    startNode
                        .arrivalAnchorId,
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
                run.player.ship
                    .weapons,
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

    const target =
        loadedEvent.state.actors.find(
            (actor) => {
                return (
                    actor.team ===
                    ENCOUNTER_TEAM.ENEMY
                );
            },
        );

    if (!target) {
        throw new Error(
            'Expected enemy target actor',
        );
    }

    return {
        engine,
        state:
            loadedEvent.state,

        targetActorId:
            target.id,
    };
}

function executeWeaponsCommand(
    engine: EncounterEngine,
    commandId: string,
): void {
    const command =
        engine
            .getAvailableCommands(
                OFFICER_ROLE.WEAPONS,
            )
            .find((candidate) => {
                return (
                    candidate.commandId ===
                    commandId
                );
            });

    if (!command) {
        throw new Error(
            'Expected available command: ' +
                commandId,
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
