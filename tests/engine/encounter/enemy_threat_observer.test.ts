// tests/engine/encounter/enemy_threat_observer.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
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
    SHIP_CHASSIS_ID,
} from '../../../src/engine/defs/ship_chassis';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import {
    STICKY_MINE_ID,
} from '../../../src/engine/defs/sticky_mine';
import EnemyThreatObserver from '../../../src/engine/encounter/combat/enemy/intel/EnemyThreatObserver';
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
    createEncounterState,
} from '../../../src/engine/encounter/state/create_encounter_state';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';
import {
    createPointDefenseFixture,
} from '../../fixtures/engine/point_defense_fixtures';
import {
    createShieldGeneratorFixture,
} from '../../fixtures/engine/shield_generator_fixtures';
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
    'Enemy threat observer',
    () => {
        it(
            'tracks player threats without copying hidden truth into observations',
            () => {
                const {
                    actor,
                    observer,
                    state,
                } = createObserverFixture();

                observer.synchronize();

                expect(
                    actor.threatObservations,
                ).toEqual([
                    {
                        id:
                            'missile:' +
                            'player_missile_00',

                        kind:
                            ENEMY_THREAT_KIND
                                .MISSILE,

                        source: {
                            kind:
                                ENEMY_THREAT_SOURCE_KIND
                                    .COMBAT_PROJECTILE,

                            projectileId:
                                'player_missile_00',
                        },
                    },
                    {
                        id:
                            'laser:' +
                            'player_laser_task_00',

                        kind:
                            ENEMY_THREAT_KIND
                                .LASER,

                        source: {
                            kind:
                                ENEMY_THREAT_SOURCE_KIND
                                    .PLAYER_OFFICER_TASK,

                            officerTaskId:
                                'player_laser_task_00',
                        },
                    },
                    {
                        id:
                            'sticky_mine:' +
                            'player_mine_00',

                        kind:
                            ENEMY_THREAT_KIND
                                .STICKY_MINE,

                        source: {
                            kind:
                                ENEMY_THREAT_SOURCE_KIND
                                    .STICKY_MINE,

                            stickyMineId:
                                'player_mine_00',
                        },
                    },
                ]);

                const serialized =
                    JSON.stringify(
                        actor
                            .threatObservations,
                    );

                expect(serialized)
                    .not.toContain(
                        MISSILE_ID.RED_00,
                    );

                expect(serialized)
                    .not.toContain(
                        STICKY_MINE_ID
                            .BASIC_00,
                    );

                const firstObservation =
                    actor
                        .threatObservations[0];

                observer.synchronize();

                expect(
                    actor
                        .threatObservations[0],
                ).toBe(
                    firstObservation,
                );

                state
                    .combat
                    .projectiles
                    .length = 0;

                state
                    .combat
                    .stickyMines
                    .length = 0;

                delete state
                    .officerTasks[
                        OFFICER_ROLE.WEAPONS
                    ];

                observer.synchronize();

                expect(
                    actor.threatObservations,
                ).toEqual([]);
            },
        );
    },
);

function createObserverFixture() {
    const {
        node,
        stationId,
    } = createSingleStationNodeFixture();

    const playerLaser = {
        id:
            'laser_player_00',

        weaponId:
            SHIP_WEAPON_ID.LASER_00,

        kind:
            SHIP_WEAPON_KIND.LASER,

        phase:
            SHIP_WEAPON_PHASE
                .CHARGING,

        phaseElapsedMs: 0,
    } as const;

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

        playerWeapons: [
            playerLaser,
        ],
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

            shieldGenerator:
                createShieldGeneratorFixture(),

            behavior:
                createShipBehaviorFixture(),

            crewRoles: [
                OFFICER_ROLE.SCIENCE,
                OFFICER_ROLE.WEAPONS,
                OFFICER_ROLE.ENGINEER,
            ],

            weapons: [],
        });

    state.combat.projectiles.push({
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
                actor.id,
        },

        identification: {
            status:
                THREAT_IDENTIFICATION_STATUS
                    .UNKNOWN,
        },

        missileId:
            MISSILE_ID.RED_00,

        timeToImpactMs: 10000,
        initialTimeToImpactMs: 10000,
    });

    state.combat.stickyMines.push({
        id:
            'player_mine_00',

        mineId:
            STICKY_MINE_ID.BASIC_00,

        source: {
            kind:
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP,
        },

        sourceWeaponId:
            'sticky_mine_dispenser_player_00',

        target: {
            kind:
                COMBAT_TARGET_KIND
                    .ACTOR,

            actorId:
                actor.id,
        },

        timeToDetonationMs: 7000,
        initialTimeToDetonationMs: 7500,

        damage: 1,
    });

    state.officerTasks[
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
        showProgress: true,

        durationMs: null,
        elapsedMs: 0,

        canBeCancelledByPlayer: true,
        canBeInterruptedByDamage: true,

        weaponId:
            playerLaser.id,

        targetActorId:
            actor.id,
    };

    return {
        actor,
        observer:
            new EnemyThreatObserver(
                state,
            ),
        state,
    };
}
