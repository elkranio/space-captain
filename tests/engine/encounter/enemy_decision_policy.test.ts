// tests/engine/encounter/enemy_decision_policy.test.ts

import {
    createPlayerHullFixture,
} from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    DEFENSE_TURRET_ID,
    DEFENSE_TURRET_PHASE,
} from '../../../src/engine/defs/defense_turret';
import {
    POWER_CORE_ID,
} from '../../../src/engine/defs/power_core';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    getMutableEncounterStateForTest,
} from './get_mutable_encounter_state_for_test';
import EnemyDecisionPolicy from '../../../src/engine/encounter/combat/enemy/EnemyDecisionPolicy';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
} from '../../../src/engine/encounter/model/enemy_threat_observation';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe(
    'Enemy decision policy',
    () => {
        it(
            'selects the first available Weapons attack in loadout order',
            () => {
                const actor =
                    createEnemyCombatActor();

                const policy =
                    new EnemyDecisionPolicy();

                expect(
                    policy.selectWork(
                        actor,
                    ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    role:
                        OFFICER_ROLE.WEAPONS,

                    weaponId:
                        'missile_launcher_00',
                });

                getWeapon(
                    actor,
                    'missile_launcher_00',
                ).phase =
                    SHIP_WEAPON_PHASE
                        .COOLDOWN;

                expect(
                    policy.selectWork(
                        actor,
                    ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    role:
                        OFFICER_ROLE.WEAPONS,

                    weaponId:
                        'beam_cannon_00',
                });

                getWeapon(
                    actor,
                    'beam_cannon_00',
                ).phase =
                    SHIP_WEAPON_PHASE
                        .COOLDOWN;

                expect(
                    policy.selectWork(
                        actor,
                    ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    role:
                        OFFICER_ROLE.WEAPONS,

                    weaponId:
                        'sticky_mine_dispenser_00',
                });
            },
        );

        it(
            'does not invent Weapons work when every Weapons tool is unavailable',
            () => {
                const actor =
                    createEnemyCombatActor();

                actor.crewRoles = [
                    OFFICER_ROLE.WEAPONS,
                ];

                const missile =
                    actor.weapons[0];

                const beamCannon =
                    actor.weapons[1];

                const mines =
                    actor.weapons[2];

                if (
                    !missile ||
                    !beamCannon ||
                    !mines ||
                    mines.kind !==
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER
                ) {
                    throw new Error(
                        'Expected combat weapon loadout',
                    );
                }

                missile.phase =
                    SHIP_WEAPON_PHASE
                        .COOLDOWN;

                beamCannon.phase =
                    SHIP_WEAPON_PHASE
                        .COOLDOWN;

                mines.ammoCount = 0;

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            actor,
                        ),
                ).toBeUndefined();
            },
        );

        it(
            'falls through to Science offense when Weapons is unavailable',
            () => {
                const actor =
                    createEnemyCombatActor();

                actor.crewRoles = [
                    OFFICER_ROLE.SCIENCE,
                ];

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            actor,
                        ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    role:
                        OFFICER_ROLE.SCIENCE,

                    weaponId:
                        'spam_projector_00',
                });
            },
        );

        it(
            'prioritizes an available missile interception over offense',
            () => {
                const actor =
                    createEnemyCombatActor();

                actor.defenseTurret = {
                    id:
                        'defense_turret_00',

                    defenseTurretId:
                        DEFENSE_TURRET_ID
                            .BASIC_00,

                    phase:
                        DEFENSE_TURRET_PHASE
                            .READY,

                    phaseElapsedMs: 0,

                    targetProjectileId:
                        null,
                };

                actor.powerCore = {
                    id:
                        'power_core_00',

                    powerCoreId:
                        POWER_CORE_ID
                            .BASIC_00,

                    charges: 4,

                    rechargeElapsedMs: 0,
                };

                const observationId =
                    'missile:projectile_00';

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            actor,
                            {
                                threats: [
                                    {
                                        kind:
                                            ENEMY_THREAT_KIND
                                                .MISSILE,

                                        observationId,

                                        projectileId:
                                            'projectile_00',

                                        timeToImpactMs:
                                            10000,
                                    },
                                ],

                                crewProgressEffects:
                                    [],
                            },
                        ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .INTERCEPT_MISSILE,

                    role:
                        OFFICER_ROLE.WEAPONS,

                    defenseTurretId:
                        'defense_turret_00',

                    projectileId:
                        'projectile_00',
                });
            },
        );

        it(
            'uses idle Science to identify an unresolved missile when no interception is available',
            () => {
                const actor =
                    createEnemyCombatActor();

                delete actor
                    .defenseTurret;

                actor
                    .threatObservations
                    .push({
                        id:
                            'missile:projectile_00',

                        kind:
                            ENEMY_THREAT_KIND
                                .MISSILE,

                        source: {
                            kind:
                                ENEMY_THREAT_SOURCE_KIND
                                    .COMBAT_PROJECTILE,

                            projectileId:
                                'projectile_00',
                        },
                    });

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            actor,
                        ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .IDENTIFY_THREAT,

                    role:
                        OFFICER_ROLE.SCIENCE,

                    observationId:
                        'missile:projectile_00',
                });
            },
        );
    },
);

function getWeapon(
    actor:
        ReturnType<
            typeof createEnemyCombatActor
        >,
    weaponId: string,
) {
    const weapon =
        actor.weapons.find(
            (candidate) => {
                return (
                    candidate.id ===
                    weaponId
                );
            },
        );

    if (!weapon) {
        throw new Error(
            'Expected enemy weapon: ' +
                weaponId,
        );
    }

    return weapon;
}

function createEnemyCombatActor() {
    const {
        node,
        stationId,
    } =
        createSingleStationNodeFixture();

    node.actors.push(
        ShipNodeActorFactory.create({
            id:
                'ship_enemy_combat_00',

            presetId:
                SHIP_NODE_ACTOR_PRESET_ID
                    .ENEMY_COMBAT_00,

            anchorId:
                stationId,
        }),
    );

    const engine =
        new EncounterEngine({
            playerHull:
                createPlayerHullFixture(),

            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    stationId,
            },

            drive:
                createShipDriveFixture(),
        });

    const [loadedEvent] =
        engine.drainEvents();

    if (
        loadedEvent.type !==
        ENCOUNTER_EVENT
            .ENCOUNTER_LOADED
    ) {
        throw new Error(
            'Expected encounter loaded event',
        );
    }

    const actor =
        getMutableEncounterStateForTest(
            engine,
        ).actors[0];

    if (!actor) {
        throw new Error(
            'Expected enemy combat actor',
        );
    }

    return actor;
}
