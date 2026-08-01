// tests/engine/encounter/player_laser_command.test.ts

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
    LASER_TARGET_ZONE,
} from '../../../src/engine/defs/laser';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';

describe('Player laser command', () => {
    it('offers three zones through one command and starts a cancellable targeting task', () => {
        const run =
            createNewRunState();

        const installedWeapon =
            run.player.ship.weapons[0];

        const installedLauncher =
            run.player.ship.weapons[1];

        if (
            !installedWeapon ||
            !installedLauncher
        ) {
            throw new Error(
                'Expected installed player weapons',
            );
        }

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

        const targetActor =
            loadedEvent.state.actors.find(
                (actor) => {
                    return (
                        actor.team ===
                        ENCOUNTER_TEAM.ENEMY
                    );
                },
            );

        if (!targetActor) {
            throw new Error(
                'Expected enemy target actor',
            );
        }

        const laserCommands =
            engine
                .getAvailableCommands(
                    OFFICER_ROLE.WEAPONS,
                )
                .filter((command) => {
                    return (
                        command.commandId ===
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_LASER
                    );
                });

        expect(
            laserCommands.map((command) => {
                return {
                    commandId:
                        command.commandId,

                    label: command.label,

                    target:
                        command.target,
                };
            }),
        ).toEqual([
            {
                commandId:
                    ENCOUNTER_OFFICER_COMMAND_ID
                        .WEAPONS_FIRE_LASER,

                label:
                    'FIRE LASER: LEFT',

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND
                            .ACTOR_LASER_ZONE,

                    weaponId:
                        'laser_player_00',

                    actorId:
                        targetActor.id,

                    targetZone:
                        LASER_TARGET_ZONE.LEFT,
                },
            },
            {
                commandId:
                    ENCOUNTER_OFFICER_COMMAND_ID
                        .WEAPONS_FIRE_LASER,

                label:
                    'FIRE LASER: CENTER',

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND
                            .ACTOR_LASER_ZONE,

                    weaponId:
                        'laser_player_00',

                    actorId:
                        targetActor.id,

                    targetZone:
                        LASER_TARGET_ZONE.CENTER,
                },
            },
            {
                commandId:
                    ENCOUNTER_OFFICER_COMMAND_ID
                        .WEAPONS_FIRE_LASER,

                label:
                    'FIRE LASER: RIGHT',

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND
                            .ACTOR_LASER_ZONE,

                    weaponId:
                        'laser_player_00',

                    actorId:
                        targetActor.id,

                    targetZone:
                        LASER_TARGET_ZONE.RIGHT,
                },
            },
        ]);

        expect(
            engine.executeCommand({
                role:
                    OFFICER_ROLE.WEAPONS,

                commandId:
                    ENCOUNTER_OFFICER_COMMAND_ID
                        .WEAPONS_FIRE_LASER,

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND
                            .ACTOR_LASER_ZONE,

                    weaponId:
                        'laser_player_00',

                    actorId:
                        targetActor.id,

                    targetZone:
                        LASER_TARGET_ZONE.CENTER,
                },
            }),
        ).toEqual({
            status:
                OFFICER_COMMAND_EXECUTION_STATUS
                    .EXECUTED,
        });

        expect(
            engine.getPlayerWeaponStates(),
        ).toEqual([
            {
                ...installedWeapon,

                phase:
                    SHIP_WEAPON_PHASE.TARGETING,

                phaseElapsedMs: 0,
            },

            installedLauncher,
        ]);

        const [task] =
            engine.getOfficerTasks();

        expect(task).toMatchObject({
            kind:
                OFFICER_TASK_KIND
                    .WEAPONS_FIRE_LASER,

            role:
                OFFICER_ROLE.WEAPONS,

            sourceCommandId:
                ENCOUNTER_OFFICER_COMMAND_ID
                    .WEAPONS_FIRE_LASER,

            weaponId:
                'laser_player_00',

            targetActorId:
                targetActor.id,

            targetZone:
                LASER_TARGET_ZONE.CENTER,

            label: 'LASER AIM',
            showProgress: false,

            durationMs: null,

            canBeCancelledByPlayer: true,
            canBeInterruptedByDamage: true,

            elapsedMs: 0,
        });

        expect(
            engine.getAvailableCommands(
                OFFICER_ROLE.WEAPONS,
            ),
        ).toEqual([]);

        if (!task) {
            throw new Error(
                'Expected player laser task',
            );
        }

        engine.cancelTask(task.id);

        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);

        expect(
            engine.getPlayerWeaponStates()[0]
                ?.phase,
        ).toBe(
            SHIP_WEAPON_PHASE.READY,
        );

        expect(
            engine
                .getAvailableCommands(
                    OFFICER_ROLE.WEAPONS,
                )
                .filter((command) => {
                    return (
                        command.commandId ===
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_LASER
                    );
                }),
        ).toHaveLength(3);
    });
});
