// tests/engine/encounter/enemy_science_identification.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import {
    CREW_TRAIT_ID,
} from '../../../src/engine/defs/crew_trait';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
import {
    MISSILE_SIGNATURE,
} from '../../../src/engine/defs/missile';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_CHASSIS_ID,
} from '../../../src/engine/defs/ship_chassis';
import EnemyBehaviorRunner from '../../../src/engine/encounter/combat/enemy/EnemyBehaviorRunner';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../../src/engine/encounter/model/combat';
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
} from '../../../src/engine/encounter/model/enemy_threat_observation';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import {
    createEncounterState,
} from '../../../src/engine/encounter/state/create_encounter_state';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';
import {
    createShipBehaviorFixture,
} from '../../fixtures/engine/ship_behavior_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

const SCIENCE_IDENTIFY_THREAT_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .SCIENCE_IDENTIFY_THREAT,
    );

describe(
    'Enemy Science identification',
    () => {
        it(
            'creates a truthful missile report after the timed Science task',
            () => {
                const {
                    actor,
                    behaviorRunner,
                } = createMissileFixture(
                    false,
                );

                behaviorRunner.step(0, () => false);

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.SCIENCE
                    ],
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .IDENTIFY_THREAT,

                    role:
                        OFFICER_ROLE.SCIENCE,

                    observationId:
                        'missile:' +
                        'player_missile_00',

                    elapsedMs: 0,

                    durationMs:
                        SCIENCE_IDENTIFY_THREAT_DURATION_MS,
                });

                behaviorRunner.step(
                    SCIENCE_IDENTIFY_THREAT_DURATION_MS -
                        1,
                    () => false,
                );

                expect(
                    actor
                        .threatObservations[0]
                        ?.report,
                ).toBeUndefined();

                behaviorRunner.step(1, () => false);

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.SCIENCE
                    ],
                ).toBeUndefined();

                expect(
                    actor
                        .threatObservations[0]
                        ?.report,
                ).toEqual({
                    kind:
                        ENEMY_THREAT_KIND
                            .MISSILE,

                    status:
                        MISSILE_SIGNATURE_INTEL_STATUS.CONFIRMED,

                    hypothesis:
                        MISSILE_SIGNATURE
                            .A,
                });
            },
        );

        it(
            'does not spend Science time on player beamCannon without identifiable intel',
            () => {
                const {
                    actor,
                    behaviorRunner,
                } = createBeamCannonFixture();

                behaviorRunner.step(0, () => false);

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.SCIENCE
                    ],
                ).toBeUndefined();

                expect(
                    actor
                        .threatObservations[0]
                        ?.report,
                ).toBeUndefined();
            },
        );

        it(
            'cancels identification when the observation disappears',
            () => {
                const {
                    actor,
                    behaviorRunner,
                    state,
                } = createMissileFixture(
                    false,
                );

                behaviorRunner.step(0, () => false);

                state
                    .combat
                    .projectiles
                    .length = 0;

                behaviorRunner.step(1000, () => false);

                expect(actor.crewTasks)
                    .toEqual({});
            },
        );
    },
);

function createMissileFixture(
    hungover: boolean,
) {
    const fixture =
        createBaseFixture(
            hungover,
        );

    fixture
        .state
        .combat
        .projectiles
        .push({
            id:
                'player_missile_00',

            designation: 'M1',

            kind:
                COMBAT_PROJECTILE_KIND
                    .MISSILE,

            source: {
                kind:
                    COMBAT_SOURCE_KIND
                        .PLAYER_SHIP,
            },

            sourceWeaponId:
                'missile_launcher_player_00',

            target: {
                kind:
                    COMBAT_TARGET_KIND
                        .ACTOR,

                actorId:
                    fixture.actor.id,
            },

            signature:
                MISSILE_SIGNATURE.A,

            identification: {
                status:
                    MISSILE_SIGNATURE_INTEL_STATUS
                        .UNKNOWN,
            },

            damage: 1,

            timeToImpactMs: 12000,
            initialTimeToImpactMs:
                12000,
        });

    fixture
        .actor
        .threatObservations
        .push({
            id:
                'missile:' +
                'player_missile_00',

            kind:
                ENEMY_THREAT_KIND.MISSILE,

            source: {
                kind:
                    ENEMY_THREAT_SOURCE_KIND
                        .COMBAT_PROJECTILE,

                projectileId:
                    'player_missile_00',
            },
        });

    return fixture;
}

function createBeamCannonFixture() {
    const fixture =
        createBaseFixture(true);

    fixture.state.officerTasks[
        OFFICER_ROLE.WEAPONS
    ] = {
        id:
            'player_beam_cannon_task_00',

        kind:
            OFFICER_TASK_KIND
                .WEAPONS_FIRE_BEAM_CANNON,

        role:
            OFFICER_ROLE.WEAPONS,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_BEAM_CANNON,

        label: 'BEAM CANNON AIM',
        showProgress: false,

        durationMs: null,
        elapsedMs: 0,

        canBeCancelledByPlayer: true,
        canBeInterruptedByDamage: true,

        weaponId:
            'beam_cannon_player_00',

        targetActorId:
            fixture.actor.id,
    };

    fixture
        .actor
        .threatObservations
        .push({
            id:
                'beamCannon:' +
                'player_beam_cannon_task_00',

            kind:
                ENEMY_THREAT_KIND.BEAM_CANNON,

            source: {
                kind:
                    ENEMY_THREAT_SOURCE_KIND
                        .PLAYER_OFFICER_TASK,

                officerTaskId:
                    'player_beam_cannon_task_00',
            },
        });

    return fixture;
}

function createBaseFixture(
    hungover: boolean,
) {
    const {
        node,
        stationId,
    } = createSingleStationNodeFixture();

    const state = createEncounterState({
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND
                .ANCHORED,
            anchorId: stationId,
        },

        playerHull: createPlayerHullFixture(),

        drive: createShipDriveFixture(),    });

    const store =
        new EncounterStateStore(state);

    const actor =
        store.spawnShipActor({
            actorId:
                'ship_enemy_00',

            chassisId:
                SHIP_CHASSIS_ID
                    .GENERIC_00,

            anchorId:
                stationId,

            team:
                ENCOUNTER_TEAM.ENEMY,

            hull: 3,
            maxHull: 3,

            drive:
                createShipDriveFixture(),

            behavior:
                createShipBehaviorFixture(),

            crewRoles: [
                OFFICER_ROLE.SCIENCE,
            ],

            crewTraitsByRole:
                hungover
                    ? {
                          [OFFICER_ROLE.SCIENCE]:
                              [
                                  CREW_TRAIT_ID
                                      .HUNGOVER,
                              ],
                      }
                    : {},

            weapons: [],
        });

    const behaviorRunner =
        new EnemyBehaviorRunner({
            state,

            emit: () => {},

            clearPlayerStickyMine:
                () => false,

            random: () => 0,
});

    return {
        actor,
        behaviorRunner,
        state,
    };
}
