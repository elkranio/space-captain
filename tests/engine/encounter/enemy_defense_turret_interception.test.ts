import {
    MISSILE_SIGNATURE,
} from '../../../src/engine/defs/missile';
import {
    CREW_TRAIT_ID,
} from '../../../src/engine/defs/crew_trait';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import {
    describe,
    expect,
    it,
} from 'vitest';
import NewGameUniverseFactory from '../../../src/engine/content/new_game/NewGameUniverseFactory';
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
    MISSILE_SIGNATURE_INTEL_STATUS,
    type MissileCombatProjectileState,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import {
    createPlayerHullFixture,
} from '../../fixtures/engine/player_hull_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    getMutableEncounterStateForTest,
} from './get_mutable_encounter_state_for_test';

const LOAD_DURATION_MS = 3000;
const COOLDOWN_DURATION_MS = 5000;
const MISSILE_FLIGHT_DURATION_MS = 12000;

const SCIENCE_IDENTIFY_THREAT_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .SCIENCE_IDENTIFY_THREAT,
    );

describe('Enemy defense-turret interception', () => {
    it('uses blind equipment chance and intercepts the player missile', () => {
        const {
            engine,
            enemy,
            projectile,
        } = createScenario(
            () => 0,
        );

        // This case intentionally exercises blind Defense Turret interception without Science.
        enemy.crewRoles =
            enemy.crewRoles.filter((role) => {
                return role !== 'science';
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

            phaseElapsedMs: 0,
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

    it('spends a charge on a blind miss and keeps the missile in flight', () => {
        const {
            engine,
            enemy,
            projectile,
        } = createScenario(
            () => 0.99,
        );

        // This case intentionally exercises blind Defense Turret interception without Science.
        enemy.crewRoles =
            enemy.crewRoles.filter((role) => {
                return role !== 'science';
            });

        projectile.signature =
            MISSILE_SIGNATURE.B;

        engine.step(0);
        engine.drainEvents();

        engine.step(LOAD_DURATION_MS);

        const events =
            engine.drainEvents();

        expect(enemy.defenseTurret).toMatchObject({
            phase:
                DEFENSE_TURRET_PHASE.COOLDOWN,
        });

        expect(
            enemy.powerCore,
        ).toMatchObject({
            charges: 3,
            rechargeElapsedMs:
                LOAD_DURATION_MS,
        });

        expect(
            getMutableEncounterStateForTest(
                engine,
            ).combat.projectiles,
        ).toEqual([
            {
                ...projectile,
                timeToImpactMs:
                    projectile.initialTimeToImpactMs -
                    LOAD_DURATION_MS,
            },
        ]);

        expect(
            events.find((event) => {
                return (
                    event.type ===
                    ENCOUNTER_EVENT
                        .ENEMY_DEFENSE_TURRET_FIRED
                );
            }),
        ).toMatchObject({

            outcome:
                DEFENSE_TURRET_SHOT_OUTCOME.MISS,

            remainingCharges: 3,
        });

        expect(
            events.some((event) => {
                return (
                    event.type ===
                    ENCOUNTER_EVENT
                        .PLAYER_MISSILE_RESOLVED
                );
            }),
        ).toBe(false);

        engine.step(COOLDOWN_DURATION_MS);

        expect(enemy.defenseTurret).toMatchObject({
            phase:
                DEFENSE_TURRET_PHASE.READY,

            phaseElapsedMs: 0,
        });
    });

    it('guarantees interception for a correct ready Science report', () => {
        const {
            engine,
            enemy,
            projectile,
        } = createScenario(
            // Blind equipment roll would miss.
            () => 0.99,
        );

        projectile.signature =
            MISSILE_SIGNATURE.B;

        engine.step(0);

        const observation =
            enemy
                .threatObservations
                .find((candidate) => {
                    return (
                        candidate.kind ===
                            'missile' &&
                        candidate.source.kind ===
                            'combat_projectile' &&
                        candidate.source.projectileId ===
                            projectile.id
                    );
                });

        if (!observation) {
            throw new Error(
                'Expected enemy missile observation',
            );
        }

        // The resolver trusts the Science report rather than objective truth.
        // A later trait atom can therefore make this report wrong.
        observation.report = {
            status: 'confirmed',

            kind: 'missile',
            hypothesis: 'signature_b',
        };

        engine.drainEvents();

        engine.step(LOAD_DURATION_MS);

        expect(
            engine
                .getCombatPresentationSnapshot().outgoingMissiles,
        ).toEqual([]);

        expect(
            engine
                .drainEvents()
                .find((event) => {
                    return (
                        event.type ===
                        ENCOUNTER_EVENT
                            .ENEMY_DEFENSE_TURRET_FIRED
                    );
                }),
        ).toMatchObject({
            projectile: {
                id: projectile.id,
            },
            outcome: 'hit',

            remainingCharges: 3,
        });
    });


    it('falls back to blind chance for a hungover wrong hypothesis and can miss', () => {
        const {
            engine,
            enemy,
            projectile,
        } = createScenario(

            // Blind equipment roll misses.
            () => 0.99,
        );

        enemy.crewTraitsByRole[
            OFFICER_ROLE.SCIENCE
        ] = [
            CREW_TRAIT_ID.HUNGOVER,
        ];

        projectile.signature =
            MISSILE_SIGNATURE.B;

        engine.step(0);
        engine.drainEvents();

        expect(enemy.defenseTurret)
            .toMatchObject({
                phase:
                    DEFENSE_TURRET_PHASE
                        .LOADING,

                targetProjectileId:
                    projectile.id,
            });

        engine.step(LOAD_DURATION_MS);

        const observation =
            enemy
                .threatObservations
                .find((candidate) => {
                    return (
                        candidate.kind ===
                            'missile' &&
                        candidate.source.kind ===
                            'combat_projectile' &&
                        candidate.source.projectileId ===
                            projectile.id
                    );
                });

        expect(
            observation?.report,
        ).toBeUndefined();

        engine.step(
            SCIENCE_IDENTIFY_THREAT_DURATION_MS *
                2,
        );

        expect(observation?.report)
            .toEqual({
                kind: 'missile',

                // Truth is BLUE. HUNGOVER Science reports RED.
                status:
                    MISSILE_SIGNATURE_INTEL_STATUS.UNCERTAIN,

                hypothesis: 'signature_a',
            });

        expect(
            engine
                .getCombatPresentationSnapshot().outgoingMissiles
                .some((candidate) => {
                    return (
                        candidate.id ===
                        projectile.id
                    );
                }),
        ).toBe(true);

        expect(
            engine
                .drainEvents()
                .find((event) => {
                    return (
                        event.type ===
                        ENCOUNTER_EVENT
                            .ENEMY_DEFENSE_TURRET_FIRED
                    );
                }),
        ).toMatchObject({
            projectile: {
                id: projectile.id,
            },

            outcome:
                DEFENSE_TURRET_SHOT_OUTCOME.MISS,

            remainingCharges: 3,
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

            signature:
                MISSILE_SIGNATURE.A,

            identification: {
                status:
                    MISSILE_SIGNATURE_INTEL_STATUS
                        .CONFIRMED,

                hypothesis:
                    'signature_a',
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
