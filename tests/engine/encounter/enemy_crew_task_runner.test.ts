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
    type BeamCannonState,
} from '../../../src/engine/defs/ship_weapon';
import EnemyCrewTaskRunner from '../../../src/engine/encounter/combat/enemy/EnemyCrewTaskRunner';
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
                                    .GUNNER,

                            weaponId:
                                weapon.id,
                        },
                    ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    role:
                        OFFICER_ROLE.GUNNER,

                    weaponId:
                        weapon.id,
                });

                expect(
                    runner.isRoleBusy(
                        actor,
                        OFFICER_ROLE
                            .GUNNER,
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
                                    .GUNNER,

                            weaponId:
                                weapon.id,
                        },
                    );
                }).toThrow(
                    'Ship crew role already busy: ' +
                        actor.id +
                        '/' +
                        OFFICER_ROLE.GUNNER,
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
                                    .SCIENTIST,

                            weaponId:
                                weapon.id,
                        },
                    );
                }).toThrow(
                    'Ship crew role is missing: ' +
                        actor.id +
                        '/' +
                        OFFICER_ROLE.SCIENTIST,
                );
            },
        );

        it(
            'completes weapon work after the weapon leaves its active phase',
            () => {
                const {
                    actor,
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
                                .GUNNER,

                        weaponId:
                            weapon.id,
                    },
                );

                runner.synchronize();

                expect(
                    actor.crewTasks[
                        OFFICER_ROLE.GUNNER
                    ],
                ).toBeDefined();


                weapon.phase =
                    SHIP_WEAPON_PHASE
                        .COOLDOWN;

                runner.synchronize();

                expect(actor.crewTasks)
                    .toEqual({});


                runner.synchronize();

            },
        );

        it(
            'cancels invalid weapon tasks',
            () => {
                const {
                    actor,
                    runner,
                    weapon,
                } = createRunnerFixture();

                startGunnerTask(
                    actor,
                    runner,
                    weapon,
                );

                actor.weapons.length = 0;

                runner.synchronize();

                expect(actor.crewTasks)
                    .toEqual({});


                actor.weapons.push(weapon);

                startGunnerTask(
                    actor,
                    runner,
                    weapon,
                );

                actor.crewRoles.length = 0;

                runner.synchronize();

                expect(actor.crewTasks)
                    .toEqual({});


                actor.crewRoles.push(
                    OFFICER_ROLE.GUNNER,
                );

                startGunnerTask(
                    actor,
                    runner,
                    weapon,
                );

                actor.hull = 0;

                runner.synchronize();

                expect(actor.crewTasks)
                    .toEqual({});

            },
        );
    },
);

function startGunnerTask(
    actor:
        ReturnType<
            typeof createRunnerFixture
        >['actor'],
    runner: EnemyCrewTaskRunner,
    weapon: BeamCannonState,
): void {
    runner.start(
        actor,
        {
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role:
                OFFICER_ROLE.GUNNER,

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

        drive: createShipDriveFixture(),    });

    const store =
        new EncounterStateStore(state);

    const weapon: BeamCannonState = {
        id: 'beam_cannon_enemy_00',

        weaponId:
            SHIP_WEAPON_ID.BEAM_CANNON_00,

        kind:
            SHIP_WEAPON_KIND.BEAM_CANNON,

        phase:
            SHIP_WEAPON_PHASE
                .TARGETING,

        phaseElapsedMs: 0,
        cooldownRemainingMs: 0,
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

            behavior:
                createShipBehaviorFixture(),

            crewRoles: [
                OFFICER_ROLE.GUNNER,
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
            SHIP_WEAPON_KIND.BEAM_CANNON
    ) {
        throw new Error(
            'Expected runtime beamCannon weapon',
        );
    }

    expect(actorWeapon).not.toBe(
        weapon,
    );

    const runner =
        new EnemyCrewTaskRunner({
            state,
        });

    return {
        actor,
        runner,
        weapon: actorWeapon,
    };
}
