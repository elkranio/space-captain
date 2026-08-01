// tests/engine/encounter/player_laser_destruction.test.ts

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

describe('Player laser enemy destruction', () => {
    it('destroys the enemy once and removes it from player targeting', () => {
        const {
            engine,
            enemyId,
        } = createCombatFixture({
            enemyHull: 1,
            enemyShieldCharges: 0,
            disableEnemyCrew: true,
        });

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
                    enemyId,

                targetZone:
                    LASER_TARGET_ZONE.CENTER,
            },
        });

        engine.drainEvents();

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS,
        );

        engine.drainEvents();

        engine.step(
            SHIP_WEAPONS[
                SHIP_WEAPON_ID.LASER_00
            ].chargeDurationMs,
        );

        const events =
            engine.drainEvents();

        expect(events).toContainEqual({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_LASER_FIRED,

            weaponId:
                'laser_player_00',

            targetActorId:
                enemyId,

            targetZone:
                LASER_TARGET_ZONE.CENTER,

            outcome:
                LASER_SHOT_OUTCOME.HIT,

            damage: 1,
            remainingHull: 0,
        });

        expect(events).toContainEqual({
            type:
                ENCOUNTER_EVENT
                    .ENEMY_SHIP_DESTROYED,

            actorId:
                enemyId,
        });

        expect(
            engine
                .getEnemyShipTelemetrySnapshots(),
        ).toEqual([]);

        expect(
            engine.getLaserAttacks(),
        ).toEqual([]);

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
        ).toEqual([]);

        engine.step(100000);

        expect(
            engine
                .drainEvents()
                .filter((event) => {
                    return (
                        event.type ===
                        ENCOUNTER_EVENT
                            .ENEMY_SHIP_DESTROYED
                    );
                }),
        ).toEqual([]);
    });

    it('does not let a zero-hull enemy schedule or advance weapons', () => {
        const {
            engine,
        } = createCombatFixture({
            enemyHull: 0,
            enemyShieldCharges: 0,
            disableEnemyCrew: false,
        });

        engine.step(100000);

        const offensiveEvents =
            engine
                .drainEvents()
                .filter((event) => {
                    return (
                        event.type ===
                            ENCOUNTER_EVENT
                                .PLAYER_SHIP_TARGETING_DETECTED ||
                        event.type ===
                            ENCOUNTER_EVENT
                                .MISSILE_LAUNCHED ||
                        event.type ===
                            ENCOUNTER_EVENT
                                .LASER_ATTACK_STARTED ||
                        event.type ===
                            ENCOUNTER_EVENT
                                .SPAM_CHANNEL_STARTED ||
                        event.type ===
                            ENCOUNTER_EVENT
                                .STICKY_MINE_ATTACHED
                    );
                });

        expect(offensiveEvents).toEqual([]);
    });
});

function createCombatFixture({
    enemyHull,
    enemyShieldCharges,
    disableEnemyCrew,
}: {
    enemyHull: number;
    enemyShieldCharges: number;
    disableEnemyCrew: boolean;
}) {
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

    enemy.hull = enemyHull;

    enemy.shieldGenerator.charges =
        enemyShieldCharges;

    enemy
        .shieldGenerator
        .chargeRegenerationElapsedMs = 0;

    if (disableEnemyCrew) {
        enemy.crewRoles = [];
        enemy.weapons = [];
    }

    const engine = new EncounterEngine({
        node:
            startNode,

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

    return {
        engine,
        enemyId:
            enemy.id,
    };
}
