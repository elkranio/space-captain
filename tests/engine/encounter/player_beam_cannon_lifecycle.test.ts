// tests/engine/encounter/player_beam_cannon_lifecycle.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
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
    SHIP_WEAPON_ID,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    BEAM_CANNON_SHOT_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    createCanonicalPlayerCombatWeapons,
} from './combat_test_support';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';

describe('Player beamCannon lifecycle', () => {
    it('charges, fires, releases Weapons and cools down', () => {
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
            playerHull: createPlayerHullFixture(),

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
            weapons:
                createCanonicalPlayerCombatWeapons(),
        });

        engine.drainEvents();

        engine.executeCommand({
            role:
                OFFICER_ROLE.WEAPONS,

            commandId:
                ENCOUNTER_OFFICER_COMMAND_ID
                    .WEAPONS_FIRE_BEAM_CANNON,

            target: {
                kind:
                    OFFICER_COMMAND_TARGET_KIND
                        .ACTOR_WEAPON,

                weaponId:
                    'beam_cannon_player_00',

                actorId: enemy.id,
            },
        });

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
                    .PLAYER_BEAM_CANNON_CHARGING_STARTED,

            weaponId:
                'beam_cannon_player_00',

            targetActorId:
                enemy.id,

            chargeDurationMs:
                SHIP_WEAPONS[
                    SHIP_WEAPON_ID.BEAM_CANNON_00
                ].chargeDurationMs,
        });

        const beamCannonDefinition =
            SHIP_WEAPONS[
                SHIP_WEAPON_ID.BEAM_CANNON_00
            ];

        engine.step(
            beamCannonDefinition
                .chargeDurationMs - 1,
        );

        expect(
            engine.getPlayerWeaponStates()[0],
        ).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.CHARGING,

            phaseElapsedMs:
                beamCannonDefinition
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
                    .PLAYER_BEAM_CANNON_FIRED,

            weaponId:
                'beam_cannon_player_00',

            targetActorId:
                enemy.id,

            outcome:
                BEAM_CANNON_SHOT_OUTCOME.HIT,

            damage: 1,

            remainingHull:
                enemy.hull - 1,
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
            beamCannonDefinition
                .cooldownDurationMs - 1,
        );

        expect(
            engine.getPlayerWeaponStates()[0],
        ).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.COOLDOWN,

            phaseElapsedMs:
                beamCannonDefinition
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
                            .WEAPONS_FIRE_BEAM_CANNON
                    );
                }),
        ).toHaveLength(1);
    });
});
