import {
    describe,
    expect,
    it,
} from 'vitest';
import NewGameUniverseFactory from '../../../src/engine/generation/new_game/NewGameUniverseFactory';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    DEFENSE_TURRET_ID,
    DEFENSE_TURRET_PHASE,
    DEFENSE_TURRET_SHOT_OUTCOME,
} from '../../../src/engine/defs/defense_turret';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import ShipDefenseTurretFactory from '../../../src/engine/generation/ship_system/ShipDefenseTurretFactory';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_MISSILE_OUTCOME,
    type MissileCombatProjectileState,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import {
    createPlayerHullFixture,
} from '../../fixtures/engine/player_hull_fixtures';
import {
    DEFENSE_TURRETS,
} from '../../../src/engine/content/catalogs/defense_turrets';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    getMutableEncounterStateForTest,
} from './get_mutable_encounter_state_for_test';

const DEFENSE_TURRET_DEFINITION =
    DEFENSE_TURRETS[
        DEFENSE_TURRET_ID.BASIC_00
    ];
const LOAD_DURATION_MS =
    DEFENSE_TURRET_DEFINITION
        .loadDurationMs;
const COOLDOWN_DURATION_MS =
    DEFENSE_TURRET_DEFINITION
        .cooldownDurationMs;
const MISSILE_FLIGHT_DURATION_MS = 12000;

describe('Enemy defense-turret interception', () => {
    it('intercepts a live player missile after loading without Science or an accuracy roll', () => {
        const {
            engine,
            enemy,
            projectile,
        } = createScenario(
            // The retired blind-intercept roll would miss at this value.
            () => 0.99,
        );

        enemy.crewRoles =
            enemy.crewRoles.filter((role) => {
                return role !== OFFICER_ROLE.SCIENCE;
            });

        engine.step(0);

        expect(enemy.defenseTurret).toMatchObject({
            phase:
                DEFENSE_TURRET_PHASE.LOADING,

            targetProjectileId:
                projectile.id,
        });

        expect(
            enemy.crewTasks[
                OFFICER_ROLE.WEAPONS
            ],
        ).toEqual({
            kind:
                SHIP_CREW_TASK_KIND
                    .INTERCEPT_MISSILE,

            role:
                OFFICER_ROLE.WEAPONS,

            defenseTurretId:
                'defense_turret_00',

            projectileId:
                projectile.id,
        });

        expect(
            engine
                .drainEvents()
                .find((event) => {
                    return (
                        event.type ===
                        ENCOUNTER_EVENT
                            .ENEMY_DEFENSE_TURRET_LOADING_STARTED
                    );
                }),
        ).toEqual({
            type:
                ENCOUNTER_EVENT
                    .ENEMY_DEFENSE_TURRET_LOADING_STARTED,

            sourceActorId: enemy.id,
            defenseTurretId:
                'defense_turret_00',

            projectileId:
                projectile.id,

            loadDurationMs:
                LOAD_DURATION_MS,
        });

        engine.step(LOAD_DURATION_MS);

        const events =
            engine.drainEvents();

        expect(enemy.defenseTurret).toMatchObject({
            phase:
                DEFENSE_TURRET_PHASE.COOLDOWN,

            phaseElapsedMs:
                LOAD_DURATION_MS,
            cooldownRemainingMs:
                COOLDOWN_DURATION_MS -
                LOAD_DURATION_MS,
            targetProjectileId: null,
        });

        expect(
            enemy.powerCore,
        ).toMatchObject({
            charges: 3,
            rechargeElapsedMs:
                LOAD_DURATION_MS,
        });

        expect(
            enemy.crewTasks[
                OFFICER_ROLE.WEAPONS
            ],
        ).toBeUndefined();

        expect(
            getMutableEncounterStateForTest(
                engine,
            ).combat.projectiles,
        ).toEqual([]);

        expect(
            events.find((event) => {
                return (
                    event.type ===
                    ENCOUNTER_EVENT
                        .ENEMY_DEFENSE_TURRET_FIRED
                );
            }),
        ).toMatchObject({
            type:
                ENCOUNTER_EVENT
                    .ENEMY_DEFENSE_TURRET_FIRED,

            sourceActorId: enemy.id,
            defenseTurretId:
                'defense_turret_00',

            outcome:
                DEFENSE_TURRET_SHOT_OUTCOME.HIT,

            remainingCharges: 3,
        });

        expect(
            events.find((event) => {
                return (
                    event.type ===
                    ENCOUNTER_EVENT
                        .PLAYER_MISSILE_RESOLVED
                );
            }),
        ).toMatchObject({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_MISSILE_RESOLVED,

            projectile: {
                id: projectile.id,
            },

            outcome:
                PLAYER_MISSILE_OUTCOME
                    .INTERCEPTED,
        });
    });
});

function createScenario(
    random: () => number,
) {
    const generation =
        NewGameUniverseFactory.create();

    const startNode =
        generation.universe.nodes.find(
            (node) => {
                return node.id === 'node_start';
            },
        );

    if (!startNode) {
        throw new Error(
            'Expected new-game start node',
        );
    }

    const engine = new EncounterEngine({
        playerHull:
            createPlayerHullFixture(),

        node: startNode,

        navigation: {
            kind:
                PLAYER_SPACE_NAVIGATION_KIND
                    .ANCHORED,

            anchorId:
                startNode.arrivalAnchorId,
        },

        drive:
            createShipDriveFixture(),
        random,
    });

    engine.drainEvents();

    const state =
        getMutableEncounterStateForTest(
            engine,
        );

    const enemy = state.actors[0];

    if (!enemy) {
        throw new Error(
            'Expected enemy actor',
        );
    }

    // This suite owns Defense Turret physics.
    // Do not couple it to the mutable debug/sandbox loadout.
    enemy.defenseTurret =
        ShipDefenseTurretFactory.create({
            id:
                'defense_turret_00',

            defenseTurretId:
                DEFENSE_TURRET_ID
                    .BASIC_00,
        });

    // This suite owns Defense Turret physics,
    // not captain attack-vs-defense strategy.
    enemy.weapons = [];

    const projectile:
        MissileCombatProjectileState = {
            id: 'projectile_player_00',
            designation: 'M1',

            kind:
                COMBAT_PROJECTILE_KIND.MISSILE,

            source: {
                kind:
                    COMBAT_SOURCE_KIND.PLAYER_SHIP,
            },

            sourceWeaponId:
                'player_missile_launcher_00',

            target: {
                kind:
                    COMBAT_TARGET_KIND.ACTOR,

                actorId: enemy.id,
            },

            damage: 1,

            timeToImpactMs:
                MISSILE_FLIGHT_DURATION_MS,

            initialTimeToImpactMs:
                MISSILE_FLIGHT_DURATION_MS,
        };

    state.combat.projectiles.push(
        projectile,
    );

    return {
        engine,
        enemy,
        projectile,
    };
}
