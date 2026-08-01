// tests/engine/encounter/player_laser_lifecycle.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
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
    SHIP_WEAPON_ID,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    LASER_SHOT_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';

describe('Player laser lifecycle', () => {
    it('targets, charges, fires, releases Weapons and cools down', () => {
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

        const enemy =
            startNode.actors.find(
                (actor) => {
                    return (
                        actor.team ===
                        ENCOUNTER_TEAM.ENEMY
                    );
                },
            );

        if (!enemy) {
            throw new Error(
                'Expected enemy target actor',
            );
        }

        // Изолируем player lifecycle
        // от enemy scheduler.
        enemy.crewRoles = [];
        enemy.weapons = [];

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

        engine.drainEvents();

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

                actorId: enemy.id,

                targetZone:
                    LASER_TARGET_ZONE.CENTER,
            },
        });

        engine.drainEvents();

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS -
                1,
        );

        expect(
            engine.getPlayerWeaponStates()[0],
        ).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.TARGETING,

            phaseElapsedMs:
                SHIP_WEAPON_TARGETING_DURATION_MS -
                1,
        });

        expect(
            engine
                .drainEvents()
                .some((event) => {
                    return (
                        event.type ===
                        ENCOUNTER_EVENT
                            .PLAYER_LASER_CHARGING_STARTED
                    );
                }),
        ).toBe(false);

        engine.step(1);

        expect(
            engine.getPlayerWeaponStates()[0],
        ).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.CHARGING,

            phaseElapsedMs: 0,
        });

        expect(
            engine.drainEvents(),
        ).toContainEqual({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_LASER_CHARGING_STARTED,

            weaponId:
                'laser_player_00',

            targetActorId:
                enemy.id,

            targetZone:
                LASER_TARGET_ZONE.CENTER,

            chargeDurationMs:
                SHIP_WEAPONS[
                    SHIP_WEAPON_ID.LASER_00
                ].chargeDurationMs,
        });

        const laserDefinition =
            SHIP_WEAPONS[
                SHIP_WEAPON_ID.LASER_00
            ];

        engine.step(
            laserDefinition
                .chargeDurationMs - 1,
        );

        expect(
            engine.getPlayerWeaponStates()[0],
        ).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.CHARGING,

            phaseElapsedMs:
                laserDefinition
                    .chargeDurationMs - 1,
        });

        engine.drainEvents();

        engine.step(1);

        expect(
            engine.getPlayerWeaponStates()[0],
        ).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.COOLDOWN,

            phaseElapsedMs: 0,
        });

        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);

        const fireEvents =
            engine.drainEvents();

        expect(fireEvents).toContainEqual({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_LASER_FIRED,

            weaponId:
                'laser_player_00',

            targetActorId:
                enemy.id,

            targetZone:
                LASER_TARGET_ZONE.CENTER,

            outcome:
                LASER_SHOT_OUTCOME.BLOCKED,

            remainingShieldCharges: 2,
        });

        expect(fireEvents).toContainEqual(
            expect.objectContaining({
                type:
                    ENCOUNTER_EVENT
                        .OFFICER_TASK_ENDED,

                outcome:
                    OFFICER_TASK_OUTCOME
                        .COMPLETED,
            }),
        );

        engine.step(
            laserDefinition
                .cooldownDurationMs - 1,
        );

        expect(
            engine.getPlayerWeaponStates()[0],
        ).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.COOLDOWN,

            phaseElapsedMs:
                laserDefinition
                    .cooldownDurationMs - 1,
        });

        engine.step(1);

        expect(
            engine.getPlayerWeaponStates()[0],
        ).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.READY,

            phaseElapsedMs: 0,
        });

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
