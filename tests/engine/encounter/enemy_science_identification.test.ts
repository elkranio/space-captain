// tests/engine/encounter/enemy_science_identification.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    OFFICER_TASK_BASE_DURATION_MS,
} from '../../../src/engine/content/rules/officer_tasks';
import {
    CREW_TRAIT_ID,
} from '../../../src/engine/defs/crew_trait';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
import {
    MISSILE_ID,
    MISSILE_SPECTRAL_BAND,
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
import EnemyTaskScheduler from '../../../src/engine/encounter/combat/enemy/EnemyTaskScheduler';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    THREAT_IDENTIFICATION_STATUS,
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
    createPointDefenseFixture,
} from '../../fixtures/engine/point_defense_fixtures';
import {
    createShipBehaviorFixture,
} from '../../fixtures/engine/ship_behavior_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe(
    'Enemy Science identification',
    () => {
        it(
            'creates a truthful missile report after the timed Science task',
            () => {
                const {
                    actor,
                    scheduler,
                } = createMissileFixture(
                    false,
                );

                scheduler.schedule(0);

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
                        OFFICER_TASK_BASE_DURATION_MS
                            .SCIENCE_IDENTIFY_THREAT,
                });

                scheduler.schedule(
                    OFFICER_TASK_BASE_DURATION_MS
                        .SCIENCE_IDENTIFY_THREAT -
                        1,
                );

                expect(
                    actor
                        .threatObservations[0]
                        ?.report,
                ).toBeUndefined();

                scheduler.schedule(1);

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

                    spectralBand:
                        MISSILE_SPECTRAL_BAND
                            .RED,
                });
            },
        );

        it(
            'does not spend Science time on retired player-laser directional intel',
            () => {
                const {
                    actor,
                    scheduler,
                } = createLaserFixture();

                scheduler.schedule(0);

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
                    scheduler,
                } = createMissileFixture(
                    false,
                );

                scheduler.schedule(0);

                actor
                    .threatObservations
                    .length = 0;

                scheduler.schedule(1000);

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

            identification: {
                status:
                    THREAT_IDENTIFICATION_STATUS
                        .UNKNOWN,
            },

            missileId:
                MISSILE_ID.RED_00,

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

function createLaserFixture() {
    const fixture =
        createBaseFixture(true);

    fixture.state.officerTasks[
        OFFICER_ROLE.WEAPONS
    ] = {
        id:
            'player_laser_task_00',

        kind:
            OFFICER_TASK_KIND
                .WEAPONS_FIRE_LASER,

        role:
            OFFICER_ROLE.WEAPONS,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_LASER,

        label: 'LASER AIM',
        showProgress: false,

        durationMs: null,
        elapsedMs: 0,

        canBeCancelledByPlayer: true,
        canBeInterruptedByDamage: true,

        weaponId:
            'laser_player_00',

        targetActorId:
            fixture.actor.id,
    };

    fixture
        .actor
        .threatObservations
        .push({
            id:
                'laser:' +
                'player_laser_task_00',

            kind:
                ENEMY_THREAT_KIND.LASER,

            source: {
                kind:
                    ENEMY_THREAT_SOURCE_KIND
                        .PLAYER_OFFICER_TASK,

                officerTaskId:
                    'player_laser_task_00',
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

        drive: createShipDriveFixture(),

        pointDefense: createPointDefenseFixture(),
    });

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

    const scheduler =
        new EnemyTaskScheduler({
            state,

            emit: () => {},

            clearPlayerStickyMine:
                () => false,

            purgePlayerSpamChannel:
                () => false,
        });

    return {
        actor,
        scheduler,
        state,
    };
}
