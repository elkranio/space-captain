// tests/engine/encounter/player_laser_damage.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
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
    SHIP_SHIELD_DURATION_MS,
} from '../../../src/engine/content/rules/shields';
import {
    createNewRunState,
} from '../../../src/engine/content/new_game/create_new_run_state';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
import {
    LASER_TARGET_ZONE,
    type LaserTargetZone,
} from '../../../src/engine/defs/laser';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_ID,
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
} from '../../../src/engine/encounter/model/event';
import {
    getMutableEncounterStateForTest,
} from './get_mutable_encounter_state_for_test';

describe('Player laser damage', () => {
    it('consumes a matching enemy directional shield before damaging hull', () => {
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

        const runtimeEnemy =
            getMutableEncounterStateForTest(
                engine,
            )
                .actors
                .find((actor) => {
                    return (
                        actor.id ===
                        enemy.id
                    );
                });

        if (!runtimeEnemy) {
            throw new Error(
                'Expected runtime enemy target',
            );
        }

        const firstFireEvents =
            fireLaser(
                engine,
                enemy.id,
                LASER_TARGET_ZONE.LEFT,

                () => {
                    runtimeEnemy.activeShield = {
                        zone:
                            LASER_TARGET_ZONE.LEFT,

                        elapsedMs: 0,

                        durationMs:
                            SHIP_SHIELD_DURATION_MS,
                    };
                },
            );

        expect(firstFireEvents).toContainEqual({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_LASER_FIRED,

            weaponId:
                'laser_player_00',

            targetActorId:
                enemy.id,

            targetZone:
                LASER_TARGET_ZONE.LEFT,

            outcome:
                LASER_SHOT_OUTCOME.BLOCKED,

            remainingShieldCharges:
                runtimeEnemy
                    .shieldGenerator
                    .charges,
        });

        expect(
            runtimeEnemy.activeShield,
        ).toBeUndefined();

        expect(
            engine
                .getEnemyShipTelemetrySnapshots()[0],
        ).toMatchObject({
            hull: {
                current: 3,
                max: 3,
            },
        });

        const laserDefinition =
            SHIP_WEAPONS[
                SHIP_WEAPON_ID.LASER_00
            ];

        engine.step(
            laserDefinition
                .cooldownDurationMs,
        );

        engine.drainEvents();

        const secondFireEvents =
            fireLaser(
                engine,
                enemy.id,
                LASER_TARGET_ZONE.RIGHT,
            );

        expect(secondFireEvents).toContainEqual({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_LASER_FIRED,

            weaponId:
                'laser_player_00',

            targetActorId:
                enemy.id,

            targetZone:
                LASER_TARGET_ZONE.RIGHT,

            outcome:
                LASER_SHOT_OUTCOME.HIT,

            damage: 1,
            remainingHull: 2,
        });

        expect(
            engine
                .getEnemyShipTelemetrySnapshots()[0],
        ).toMatchObject({
            hull: {
                current: 2,
                max: 3,
            },
        });
    });
});

function fireLaser(
    engine: EncounterEngine,
    targetActorId: string,
    targetZone: LaserTargetZone,

    prepareImpact?: () => void,
) {
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
                targetActorId,

            targetZone,
        },
    });

    engine.drainEvents();

    engine.step(
        SHIP_WEAPON_TARGETING_DURATION_MS,
    );

    engine.drainEvents();

    const chargeDurationMs =
        SHIP_WEAPONS[
            SHIP_WEAPON_ID.LASER_00
        ].chargeDurationMs;

    engine.step(
        chargeDurationMs - 1,
    );

    engine.drainEvents();

    prepareImpact?.();

    engine.step(1);

    return engine.drainEvents();
}
