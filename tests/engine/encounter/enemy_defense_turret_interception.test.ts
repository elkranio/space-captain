import {
    CREW_TRAIT_ID,
} from '../../../src/engine/defs/crew_trait';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    MISSILES,
} from '../../../src/engine/content/catalogs/missiles';
import NewGameUniverseFactory from '../../../src/engine/content/new_game/NewGameUniverseFactory';
import {
    MISSILE_ID,
} from '../../../src/engine/defs/missile';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    DEFENSE_TURRET_BEAM_BAND,
    DEFENSE_TURRET_PHASE,
    DEFENSE_TURRET_SHOT_OUTCOME,
} from '../../../src/engine/defs/defense_turret';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_MISSILE_OUTCOME,
    THREAT_IDENTIFICATION_STATUS,
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
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    getMutableEncounterStateForTest,
} from './get_mutable_encounter_state_for_test';

const LOAD_DURATION_MS = 3000;
const COOLDOWN_DURATION_MS = 5000;

describe('Enemy defense-turret interception', () => {
    it('loads a blind matching band and intercepts the player missile', () => {
        const {
            engine,
            enemy,
            projectile,
        } = createScenario(
            MISSILE_ID.RED_00,
            () => 0,
        );

        // This case intentionally exercises blind PD without Science.
        enemy.crewRoles =
            enemy.crewRoles.filter((role) => {
                return role !== 'science';
            });

        engine.step(0);

        expect(enemy.defenseTurret).toMatchObject({
            phase:
                DEFENSE_TURRET_PHASE.LOADING,

            loadedBand:
                DEFENSE_TURRET_BEAM_BAND.RED,

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

            beamBand:
                DEFENSE_TURRET_BEAM_BAND.RED,
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

            beamBand:
                DEFENSE_TURRET_BEAM_BAND.RED,

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
            loadedBand: null,
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

            beamBand:
                DEFENSE_TURRET_BEAM_BAND.RED,

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
            MISSILE_ID.BLUE_00,
            () => 0,
        );

        // This case intentionally exercises blind PD without Science.
        enemy.crewRoles =
            enemy.crewRoles.filter((role) => {
                return role !== 'science';
            });

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
            beamBand:
                DEFENSE_TURRET_BEAM_BAND.RED,

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

    it('uses a ready Science report instead of the blind fallback band', () => {
        const {
            engine,
            enemy,
            projectile,
        } = createScenario(
            MISSILE_ID.BLUE_00,
            // Blind fallback is RED and would miss.
            () => 0,
        );

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
            kind: 'missile',
            spectralBand: 'blue',
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

            beamBand: 'blue',
            outcome: 'hit',

            remainingCharges: 3,
        });
    });


    it('trusts a hungover Science report and misses a missile it could blindly hit', () => {
        const {
            engine,
            enemy,
            projectile,
        } = createScenario(
            MISSILE_ID.BLUE_00,

            // Blind fallback is BLUE and would hit.
            () => 1,
        );

        enemy.crewTraitsByRole[
            OFFICER_ROLE.SCIENCE
        ] = [
            CREW_TRAIT_ID.HUNGOVER,
        ];

        engine.step(0);
        engine.drainEvents();

        expect(enemy.defenseTurret)
            .toMatchObject({
                phase:
                    DEFENSE_TURRET_PHASE
                        .LOADING,

                loadedBand:
                    DEFENSE_TURRET_BEAM_BAND
                        .BLUE,

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

        expect(observation?.report)
            .toEqual({
                kind: 'missile',

                // Truth is BLUE. HUNGOVER Science reports RED.
                spectralBand: 'red',
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

            beamBand:
                DEFENSE_TURRET_BEAM_BAND.RED,

            outcome:
                DEFENSE_TURRET_SHOT_OUTCOME.MISS,

            remainingCharges: 3,
        });
    });

});

function createScenario(
    missileId:
        typeof MISSILE_ID.RED_00 |
        typeof MISSILE_ID.BLUE_00,
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

    if (!enemy?.defenseTurret) {
        throw new Error(
            'Expected enemy defense turret',
        );
    }

    const missile =
        MISSILES[missileId];

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

            identification: {
                status:
                    THREAT_IDENTIFICATION_STATUS
                        .IDENTIFIED,

                spectralBand:
                    missile.spectralBand,
            },

            missileId,

            timeToImpactMs:
                missile.flightDurationMs,

            initialTimeToImpactMs:
                missile.flightDurationMs,
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
