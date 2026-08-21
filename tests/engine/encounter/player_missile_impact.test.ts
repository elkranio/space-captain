// tests/engine/encounter/player_missile_impact.test.ts
import { getTestMissileTargetingDurationMs } from './combat_test_support';

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
};

describe('Player missile impact', () => {
    it('advances flight and damages hull on impact', () => {
        const {
            engine,
            damage,
            flightDurationMs,
            targetActorId,
            initialHull,
        } = createMissileImpactSetup({
            enemyHull: 2,
        });

        engine.step(
            flightDurationMs - 1,
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
                    initialHull - damage,
            },
        });

        expect(
            getDestroyedEvents(engine),
        ).toEqual([]);
    });

    it('damages hull when the full flight duration elapses', () => {
        const {
            engine,
            damage,
            flightDurationMs,
            targetActorId,
            initialHull,
        } = createMissileImpactSetup({
            enemyHull: 2,
        });

        engine.step(
            flightDurationMs,
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
                    initialHull - damage,
            },
        });

        expect(
            getDestroyedEvents(engine),
        ).toEqual([]);
    });

    it('uses one shared enemy destruction flow and emits it once', () => {
        const {
            engine,
            flightDurationMs,
            targetActorId,
        } = createMissileImpactSetup({
            enemyHull: 1,
        });

        engine.step(
            flightDurationMs,
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
        });

        expect(
            getDestroyedEvents(engine),
        ).toEqual([]);
    });

    it('does not expose an outgoing player missile to the player defense turret', () => {
        const {
            engine,
        } = createMissileImpactSetup({
            enemyHull: 2,
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
                                .WEAPONS_INTERCEPT_MISSILE
                    );
                }),
        ).toEqual([]);
    });
});

function createMissileImpactSetup({
    enemyHull = 2,
}: MissileImpactSetupOptions): {
    engine: EncounterEngine;

    damage: number;
    flightDurationMs: number;
    targetActorId: string;

    initialHull: number;
} {
    const run =
        createNewRunState();

    const startNode =
        run.universe.nodes.find((node) => {
            return (
                node.id ===
                'node_start'
            );
        });

    if (!startNode) {
        throw new Error(
            'Expected new-game start node',
        );
    }

    const enemy =
        startNode.actors.find((actor) => {
            return (
                actor.team ===
                ENCOUNTER_TEAM.ENEMY
            );
        });

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
        launcher.ammoCount <= 0
    ) {
        throw new Error(
            'Expected armed player missile launcher',
        );
    }

    const definition =
        SHIP_WEAPONS[
            launcher.weaponId
        ];

    if (
        definition.kind !==
        SHIP_WEAPON_KIND
            .MISSILE_LAUNCHER
    ) {
        throw new Error(
            'Expected missile launcher definition',
        );
    }

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
                    .ACTOR_WEAPON,

            weaponId:
                launcher.id,

            actorId:
                enemy.id,
        },
    });

    engine.step(
        getTestMissileTargetingDurationMs(),
    );

    expect(
        engine.getCombatProjectiles(),
    ).toHaveLength(1);

    engine.drainEvents();

    return {
        engine,

        damage:
            definition.damage,

        flightDurationMs:
            definition.flightDurationMs,

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
