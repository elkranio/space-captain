// tests/engine/encounter/player_missile_presentation_events.test.ts

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
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_MISSILE_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';

describe('Player missile presentation events', () => {
    it('emits an explicit launch event and separates outgoing snapshots', () => {
        const {
            engine,
            missileId,
            targetActorId,
        } = createSetup({
            enemyShieldCharges: 0,
            enemyHull: 2,
        });

        launchMissile(
            engine,
            targetActorId,
        );

        const events =
            engine.drainEvents();

        expect(events).toContainEqual({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_MISSILE_LAUNCHED,

            projectile:
                expect.objectContaining({
                    id: 'projectile_1',

                    missileId,

                    source: {
                        kind:
                            COMBAT_SOURCE_KIND
                                .PLAYER_SHIP,
                    },

                    target: {
                        kind:
                            COMBAT_TARGET_KIND
                                .ACTOR,

                        actorId:
                            targetActorId,
                    },
                }),
        });

        expect(
            events.some((event) => {
                return (
                    event.type ===
                    ENCOUNTER_EVENT
                        .MISSILE_LAUNCHED
                );
            }),
        ).toBe(false);

        expect(
            engine
                .getIncomingMissileProjectiles(),
        ).toEqual([]);

        expect(
            engine
                .getOutgoingMissileProjectiles(),
        ).toHaveLength(1);
    });

    it('emits target-lost resolution without an impact', () => {
        const {
            engine,
            targetActorId,
        } = createSetup({
            enemyShieldCharges: 0,
            enemyHull: 2,
        });

        launchMissile(
            engine,
            targetActorId,
        );

        engine.drainEvents();

        engine.setActorTeam(
            targetActorId,
            ENCOUNTER_TEAM.NEUTRAL,
        );

        engine.step(1);

        expect(
            engine.drainEvents(),
        ).toContainEqual({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_MISSILE_RESOLVED,

            projectile:
                expect.objectContaining({
                    id: 'projectile_1',

                    target: {
                        kind:
                            COMBAT_TARGET_KIND
                                .ACTOR,

                        actorId:
                            targetActorId,
                    },
                }),

            outcome:
                PLAYER_MISSILE_OUTCOME
                    .TARGET_LOST,
        });

        expect(
            engine
                .getOutgoingMissileProjectiles(),
        ).toEqual([]);
    });

    it('reports a hull hit even while the enemy shield is charged', () => {
        const hit =
            createSetup({
                enemyShieldCharges: 1,
                enemyHull: 2,
            });

        launchMissile(
            hit.engine,
            hit.targetActorId,
        );

        hit.engine.drainEvents();

        hit.engine.step(
            MISSILES[hit.missileId]
                .flightDurationMs,
        );

        expect(
            hit.engine.drainEvents(),
        ).toContainEqual({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_MISSILE_RESOLVED,

            projectile:
                expect.objectContaining({
                    id: 'projectile_1',
                    timeToImpactMs: 0,
                }),

            outcome:
                PLAYER_MISSILE_OUTCOME.HIT,

            damage:
                MISSILES[hit.missileId]
                    .damage,

            remainingHull:
                2 -
                MISSILES[hit.missileId]
                    .damage,
        });
    });
});

function createSetup({
    enemyShieldCharges,
    enemyHull,
}: {
    enemyShieldCharges: number;
    enemyHull: number;
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
            'Expected loaded player launcher',
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
                run.player.ship.weapons,
        });

    engine.drainEvents();

    return {
        engine,

        missileId:
            launcher.loadedMissileId,

        targetActorId:
            enemy.id,
    };
}

function launchMissile(
    engine: EncounterEngine,
    targetActorId: string,
): void {
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
                targetActorId,
        },
    });

    engine.step(
        SHIP_WEAPON_TARGETING_DURATION_MS,
    );
}
