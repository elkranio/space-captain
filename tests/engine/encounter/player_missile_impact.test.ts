// tests/engine/encounter/player_missile_impact.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    MISSILES,
} from '../../../src/engine/content/catalogs/missiles';
import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    createNewRunState,
} from '../../../src/engine/content/new_game/create_new_run_state';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
import type {
    MissileId,
} from '../../../src/engine/defs/missile';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_KIND,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';

type MissileImpactSetupOptions = {
    enemyHull?: number;
    enemyShieldCharges?: number;
};

describe('Player missile impact', () => {
    it('advances flight and damages hull without consuming the enemy shield', () => {
        const {
            engine,
            missileId,
            targetActorId,
            initialHull,
        } = createMissileImpactSetup({
            enemyHull: 2,
            enemyShieldCharges: 1,
        });

        const missile =
            MISSILES[missileId];

        engine.step(
            missile.flightDurationMs -
                1,
        );

        expect(
            engine.getCombatProjectiles()[0],
        ).toMatchObject({
            timeToImpactMs: 1,
        });

        expect(
            getTargetTelemetry(
                engine,
                targetActorId,
            ),
        ).toMatchObject({
            hull: {
                current:
                    initialHull,
            },

            shieldGenerator: {
                current: 1,
            },
        });

        engine.step(1);

        expect(
            engine.getCombatProjectiles(),
        ).toEqual([]);

        expect(
            getTargetTelemetry(
                engine,
                targetActorId,
            ),
        ).toMatchObject({
            hull: {
                current:
                    initialHull -
                    missile.damage,
            },

            shieldGenerator: {
                current: 1,
            },
        });

        expect(
            getDestroyedEvents(engine),
        ).toEqual([]);
    });

    it('damages hull when the enemy has no shield charges', () => {
        const {
            engine,
            missileId,
            targetActorId,
            initialHull,
        } = createMissileImpactSetup({
            enemyHull: 2,
            enemyShieldCharges: 0,
        });

        engine.step(
            MISSILES[missileId]
                .flightDurationMs,
        );

        expect(
            engine.getCombatProjectiles(),
        ).toEqual([]);

        expect(
            getTargetTelemetry(
                engine,
                targetActorId,
            ),
        ).toMatchObject({
            hull: {
                current:
                    initialHull -
                    MISSILES[missileId]
                        .damage,
            },

            shieldGenerator: {
                current: 0,
            },
        });

        expect(
            getDestroyedEvents(engine),
        ).toEqual([]);
    });

    it('uses one shared enemy destruction flow and emits it once', () => {
        const {
            engine,
            missileId,
            targetActorId,
        } = createMissileImpactSetup({
            enemyHull: 1,
            enemyShieldCharges: 0,
        });

        engine.step(
            MISSILES[missileId]
                .flightDurationMs,
        );

        expect(
            engine.getCombatProjectiles(),
        ).toEqual([]);

        expect(
            engine
                .getEnemyShipTelemetrySnapshots(),
        ).toEqual([]);

        expect(
            getDestroyedEvents(engine),
        ).toEqual([
            {
                type:
                    ENCOUNTER_EVENT
                        .ENEMY_SHIP_DESTROYED,

                actorId:
                    targetActorId,
            },
        ]);

        engine.step(0);

        expect(
            getDestroyedEvents(engine),
        ).toEqual([]);
    });

    it('removes the projectile without impact when its target stops being an enemy', () => {
        const {
            engine,
            targetActorId,
        } = createMissileImpactSetup({
            enemyHull: 2,
            enemyShieldCharges: 0,
        });

        engine.setActorTeam(
            targetActorId,
            ENCOUNTER_TEAM.NEUTRAL,
        );

        engine.step(1);

        expect(
            engine.getCombatProjectiles(),
        ).toEqual([]);

        engine.setActorTeam(
            targetActorId,
            ENCOUNTER_TEAM.ENEMY,
        );

        expect(
            getTargetTelemetry(
                engine,
                targetActorId,
            ),
        ).toMatchObject({
            hull: {
                current: 2,
            },

            shieldGenerator: {
                current: 0,
            },
        });

        expect(
            getDestroyedEvents(engine),
        ).toEqual([]);
    });

    it('does not expose a player missile to Science or point defense', () => {
        const {
            engine,
        } = createMissileImpactSetup({
            enemyHull: 2,
            enemyShieldCharges: 0,
        });

        expect(
            engine
                .getAvailableCommands(
                    OFFICER_ROLE.SCIENCE,
                )
                .filter((command) => {
                    return (
                        command.commandId ===
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .SCIENCE_IDENTIFY_THREAT
                    );
                }),
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
                                .WEAPONS_FIRE_RED_BEAM ||
                        command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .WEAPONS_FIRE_BLUE_BEAM
                    );
                }),
        ).toEqual([]);
    });
});

function createMissileImpactSetup({
    enemyHull = 2,
    enemyShieldCharges = 0,
}: MissileImpactSetupOptions): {
    engine: EncounterEngine;

    missileId: MissileId;
    targetActorId: string;

    initialHull: number;
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

    // Изолируем player projectile lifecycle
    // от enemy scheduler и incoming threats.
    enemy.crewRoles = [];
    enemy.weapons = [];

    enemy.hull = enemyHull;
    enemy.maxHull =
        Math.max(
            enemy.maxHull,
            enemyHull,
        );

    enemy.shieldGenerator.charges =
        enemyShieldCharges;

    enemy.shieldGenerator.maxCharges =
        Math.max(
            enemy.shieldGenerator
                .maxCharges,
            enemyShieldCharges,
        );

    enemy
        .shieldGenerator
        .chargeRegenerationElapsedMs =
        1234;

    const launcher =
        run.player.ship.weapons.find(
            (weapon) => {
                return (
                    weapon.kind ===
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER
                );
            },
        );

    if (
        !launcher ||
        launcher.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER ||
        !launcher.loadedMissileId
    ) {
        throw new Error(
            'Expected loaded player missile launcher',
        );
    }

    const missileId =
        launcher.loadedMissileId;

    const engine = new EncounterEngine({
        playerHull: createPlayerHullFixture(),

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
            run.player.ship.weapons,
    });

    engine.drainEvents();

    engine.executeCommand({
        role:
            OFFICER_ROLE.WEAPONS,

        commandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_MISSILE,

        target: {
            kind:
                OFFICER_COMMAND_TARGET_KIND
                    .ACTOR,

            actorId:
                enemy.id,
        },
    });

    engine.step(
        SHIP_WEAPON_TARGETING_DURATION_MS,
    );

    expect(
        engine.getCombatProjectiles(),
    ).toHaveLength(1);

    engine.drainEvents();

    return {
        engine,

        missileId,
        targetActorId:
            enemy.id,

        initialHull:
            enemyHull,
    };
}

function getTargetTelemetry(
    engine: EncounterEngine,
    targetActorId: string,
) {
    const telemetry =
        engine
            .getEnemyShipTelemetrySnapshots()
            .find((snapshot) => {
                return (
                    snapshot.actorId ===
                    targetActorId
                );
            });

    if (!telemetry) {
        throw new Error(
            'Expected enemy telemetry: ' +
                targetActorId,
        );
    }

    return telemetry;
}

function getDestroyedEvents(
    engine: EncounterEngine,
) {
    return engine
        .drainEvents()
        .filter((event) => {
            return (
                event.type ===
                ENCOUNTER_EVENT
                    .ENEMY_SHIP_DESTROYED
            );
        });
}
