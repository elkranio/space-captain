// tests/engine/encounter/enemy_crew_task_runner.test.ts

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
    OFFICER_ROLE,
    type OfficerRole,
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
    type LaserWeaponState,
} from '../../../src/engine/defs/ship_weapon';
import EnemyCrewTaskRunner from '../../../src/engine/encounter/combat/EnemyCrewTaskRunner';
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
    'Enemy crew task runner',
    () => {
        it(
            'owns role occupancy and rejects invalid starts',
            () => {
                const {
                    actor,
                    runner,
                    weapon,
                } = createRunnerFixture();

                expect(
                    runner.start(
                        actor,
                        {
                            kind:
                                SHIP_CREW_TASK_KIND
                                    .OPERATE_WEAPON,

                            role:
                                OFFICER_ROLE
                                    .WEAPONS,

                            weaponId:
                                weapon.id,
                        },
                    ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    role:
                        OFFICER_ROLE.WEAPONS,

                    weaponId:
                        weapon.id,
                });

                expect(
                    runner.isRoleBusy(
                        actor,
                        OFFICER_ROLE
                            .WEAPONS,
                    ),
                ).toBe(true);

                expect(() => {
                    runner.start(
                        actor,
                        {
                            kind:
                                SHIP_CREW_TASK_KIND
                                    .OPERATE_WEAPON,

                            role:
                                OFFICER_ROLE
                                    .WEAPONS,

                            weaponId:
                                weapon.id,
                        },
                    );
                }).toThrow(
                    'Ship crew role already busy: ' +
                        actor.id +
                        '/' +
                        OFFICER_ROLE.WEAPONS,
                );

                expect(() => {
                    runner.start(
                        actor,
                        {
                            kind:
                                SHIP_CREW_TASK_KIND
                                    .OPERATE_WEAPON,

                            role:
                                OFFICER_ROLE
                                    .SCIENCE,

                            weaponId:
                                weapon.id,
                        },
                    );
                }).toThrow(
                    'Ship crew role is missing: ' +
                        actor.id +
                        '/' +
                        OFFICER_ROLE.SCIENCE,
                );
            },
        );

        it(
            'completes an offensive task only after the weapon leaves its active phase',
            () => {
                const {
                    actor,
                    completedRoles,
                    runner,
                    weapon,
                } = createRunnerFixture();

                runner.start(
                    actor,
                    {
                        kind:
                            SHIP_CREW_TASK_KIND
                                .OPERATE_WEAPON,

                        role:
                            OFFICER_ROLE
                                .WEAPONS,

                        weaponId:
                            weapon.id,
                    },
                );

                runner.synchronize();

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.WEAPONS
                    ],
                ).toBeDefined();

                expect(completedRoles)
                    .toEqual([]);

                weapon.phase =
                    SHIP_WEAPON_PHASE
                        .COOLDOWN;

                runner.synchronize();

                expect(actor.crewTasks)
                    .toEqual({});

                expect(completedRoles)
                    .toEqual([
                        OFFICER_ROLE.WEAPONS,
                    ]);

                runner.synchronize();

                expect(completedRoles)
                    .toEqual([
                        OFFICER_ROLE.WEAPONS,
                    ]);
            },
        );

        it(
            'cancels invalid tasks without reporting offensive completion',
            () => {
                const {
                    actor,
                    completedRoles,
                    runner,
                    weapon,
                } = createRunnerFixture();

                startWeaponsTask(
                    actor,
                    runner,
                    weapon,
                );

                actor.weapons.length = 0;

                runner.synchronize();

                expect(actor.crewTasks)
                    .toEqual({});

                expect(completedRoles)
                    .toEqual([]);

                actor.weapons.push(weapon);

                startWeaponsTask(
                    actor,
                    runner,
                    weapon,
                );

                actor.crewRoles.length = 0;

                runner.synchronize();

                expect(actor.crewTasks)
                    .toEqual({});

                expect(completedRoles)
                    .toEqual([]);

                actor.crewRoles.push(
                    OFFICER_ROLE.WEAPONS,
                );

                startWeaponsTask(
                    actor,
                    runner,
                    weapon,
                );

                actor.hull = 0;

                runner.synchronize();

                expect(actor.crewTasks)
                    .toEqual({});

                expect(completedRoles)
                    .toEqual([]);
            },
        );
    },
);

function startWeaponsTask(
    actor:
        ReturnType<
            typeof createRunnerFixture
        >['actor'],
    runner: EnemyCrewTaskRunner,
    weapon: LaserWeaponState,
): void {
    runner.start(
        actor,
        {
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role:
                OFFICER_ROLE.WEAPONS,

            weaponId:
                weapon.id,
        },
    );
}

function createRunnerFixture() {
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

    const weapon: LaserWeaponState = {
        id: 'laser_enemy_00',

        weaponId:
            SHIP_WEAPON_ID.LASER_00,

        kind:
            SHIP_WEAPON_KIND.LASER,

        phase:
            SHIP_WEAPON_PHASE
                .TARGETING,

        phaseElapsedMs: 0,
    };

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
                OFFICER_ROLE.WEAPONS,
            ],

            weapons: [
                weapon,
            ],
        });

    const actorWeapon =
        actor.weapons[0];

    if (
        !actorWeapon ||
        actorWeapon.kind !==
            SHIP_WEAPON_KIND.LASER
    ) {
        throw new Error(
            'Expected runtime laser weapon',
        );
    }

    expect(actorWeapon).not.toBe(
        weapon,
    );

    const completedRoles:
        OfficerRole[] = [];

    const runner =
        new EnemyCrewTaskRunner({
            state,

            onOffensiveTaskCompleted:
                (_actor, role) => {
                    completedRoles.push(
                        role,
                    );
                },

            onShieldDeploymentCompleted:
                () => {},

            onStickyMineClearingCompleted:
                () => {},

            onSpamPurgingCompleted:
                () => {},

            onThreatIdentificationCompleted:
                () => {},
        });

    return {
        actor,
        completedRoles,
        runner,
        weapon: actorWeapon,
    };
}
