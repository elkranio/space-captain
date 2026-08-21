// tests/engine/encounter/player_missile_presentation_events.test.ts
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
            targetActorId,
        } = createSetup({
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

        const launchEvent = events.find((event) => {
            return (
                event.type ===
                ENCOUNTER_EVENT
                    .PLAYER_MISSILE_LAUNCHED
            );
        });

        if (
            !launchEvent ||
            launchEvent.projectile.target.kind !==
                COMBAT_TARGET_KIND.ACTOR
        ) {
            throw new Error(
                'Expected outgoing player missile launch event',
            );
        }

        expect(
            launchEvent.projectile,
        ).not.toHaveProperty(
            'signature',
        );

        launchEvent.projectile.target.actorId =
            'mutated_event_target';

        expect(
            engine
                .getCombatPresentationSnapshot().incomingMissiles,
        ).toEqual([]);

        expect(
            engine
                .getCombatPresentationSnapshot().outgoingMissiles,
        ).toEqual([
            expect.objectContaining({
                target: {
                    kind:
                        COMBAT_TARGET_KIND
                            .ACTOR,

                    actorId:
                        targetActorId,
                },
            }),
        ]);
    });

    it('emits target-lost resolution without an impact', () => {
        const {
            engine,
            targetActorId,
        } = createSetup({
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
                .getCombatPresentationSnapshot().outgoingMissiles,
        ).toEqual([]);
    });

    it('reports a hull hit on impact', () => {
        const hit =
            createSetup({
                enemyHull: 2,
            });

        launchMissile(
            hit.engine,
            hit.targetActorId,
        );

        hit.engine.drainEvents();

        hit.engine.step(
            hit.flightDurationMs,
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
                hit.damage,

            remainingHull:
                2 - hit.damage,
        });
    });
});

function createSetup({
    enemyHull,
}: {
    enemyHull: number;
}) {
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
            'Expected armed player launcher',
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

    const engine =
        new EncounterEngine({
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

    return {
        engine,

        damage:
            definition.damage,

        flightDurationMs:
            definition.flightDurationMs,

        targetActorId:
            enemy.id,
    };
}

function launchMissile(
    engine: EncounterEngine,
    targetActorId: string,
): void {
    const command =
        engine
            .getAvailableCommands(
                OFFICER_ROLE.WEAPONS,
            )
            .find((candidate) => {
                return (
                    candidate.commandId ===
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_MISSILE &&
                    candidate.target.kind ===
                        OFFICER_COMMAND_TARGET_KIND
                            .ACTOR_WEAPON &&
                    candidate.target.actorId ===
                        targetActorId
                );
            });

    if (!command) {
        throw new Error(
            'Expected FIRE MISSILE command',
        );
    }

    engine.executeCommand({
        role:
            OFFICER_ROLE.WEAPONS,

        commandId:
            command.commandId,

        target:
            command.target,
    });

    engine.step(
        getTestMissileTargetingDurationMs(),
    );
}
