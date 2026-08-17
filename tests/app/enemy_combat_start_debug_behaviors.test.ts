import {
    afterEach,
    describe,
    expect,
    it,
} from 'vitest';
import {
    applyEnemyCombatStartDebugBehaviors,
} from '../../src/app/debug/apply_enemy_combat_start_debug_behaviors';
import {
    ENEMY_DEBUG_BEHAVIORS,
} from '../../src/app/debug/enemy_debug_behaviors';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../src/engine/content/presets/ship_node_actors';
import {
    SHIP_EVADE_PHASE,
} from '../../src/engine/defs/ship_evade';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../src/engine/defs/player_location';
import EncounterEngine from '../../src/engine/encounter/EncounterEngine';
import ShipNodeActorFactory from '../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import {
    createPlayerHullFixture,
} from '../fixtures/engine/player_hull_fixtures';
import {
    createShipDriveFixture,
} from '../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../fixtures/engine/space_node_fixtures';

const originalEvadeAtCombatStart =
    ENEMY_DEBUG_BEHAVIORS
        .evadeAtCombatStart;

afterEach(() => {
    ENEMY_DEBUG_BEHAVIORS
        .evadeAtCombatStart =
        originalEvadeAtCombatStart;
});

describe(
    'enemy combat-start debug behaviors',
    () => {
        it(
            'does not start enemy Evade when the debug behavior is disabled',
            () => {
                const {
                    engine,
                    enemyActorId,
                } =
                    createEngineWithEnemy();

                ENEMY_DEBUG_BEHAVIORS
                    .evadeAtCombatStart =
                    false;

                applyEnemyCombatStartDebugBehaviors(
                    engine,
                );

                const enemy =
                    engine
                        .getPresentationSnapshot()
                        .enemyShips
                        .find((candidate) => {
                            return (
                                candidate.actorId ===
                                enemyActorId
                            );
                        });

                expect(
                    enemy?.evade,
                ).toEqual({
                    phase:
                        SHIP_EVADE_PHASE
                            .READY,

                    phaseElapsedMs:
                        0,

                    cooldownRemainingMs:
                        0,
                });
            },
        );

        it(
            'starts the shared enemy Evade lifecycle when the debug behavior is enabled',
            () => {
                const {
                    engine,
                    enemyActorId,
                } =
                    createEngineWithEnemy();

                ENEMY_DEBUG_BEHAVIORS
                    .evadeAtCombatStart =
                    true;

                applyEnemyCombatStartDebugBehaviors(
                    engine,
                );

                const enemy =
                    engine
                        .getPresentationSnapshot()
                        .enemyShips
                        .find((candidate) => {
                            return (
                                candidate.actorId ===
                                enemyActorId
                            );
                        });

                if (!enemy) {
                    throw new Error(
                        'Expected enemy presentation',
                    );
                }

                const actor =
                    engine
                        .getPresentationSnapshot()
                        .enemyShips
                        .find((candidate) => {
                            return (
                                candidate.actorId ===
                                enemyActorId
                            );
                        });

                if (!actor) {
                    throw new Error(
                        'Expected enemy actor',
                    );
                }

                expect([
                    SHIP_EVADE_PHASE
                        .WARMUP,
                    SHIP_EVADE_PHASE
                        .EVADING,
                ]).toContain(
                    actor.evade.phase,
                );

                expect(
                    actor.evade
                        .cooldownRemainingMs,
                ).toBeGreaterThan(
                    0,
                );
            },
        );
    },
);

function createEngineWithEnemy(): {
    engine: EncounterEngine;
    enemyActorId: string;
} {
    const {
        node,
        stationId,
    } =
        createSingleStationNodeFixture();

    const enemyActorId =
        'ship_enemy_00';

    node.actors.push(
        ShipNodeActorFactory
            .create({
                id:
                    enemyActorId,

                presetId:
                    SHIP_NODE_ACTOR_PRESET_ID
                        .ENEMY_GENERIC_00,

                anchorId:
                    stationId,
            }),
    );

    const engine =
        new EncounterEngine({
            playerHull:
                createPlayerHullFixture(),

            drive:
                createShipDriveFixture(),

            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    stationId,
            },

            random:
                () => 0.5,
        });

    engine.drainEvents();

    return {
        engine,
        enemyActorId,
    };
}

