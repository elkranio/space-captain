import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    DEFENSE_TURRET_ID,
    DEFENSE_TURRET_SHOT_OUTCOME,
} from '../../../src/engine/defs/defense_turret';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import type {
    PowerCoreState,
} from '../../../src/engine/defs/power_core';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_KIND,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_RESULT_KIND,
} from '../../../src/engine/encounter/model/event';
import ShipDefenseTurretFactory from '../../../src/engine/generation/ship_system/ShipDefenseTurretFactory';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import {
    createPlayerHullFixture,
} from '../../fixtures/engine/player_hull_fixtures';
import {
    createPowerCoreFixture,
} from '../../fixtures/engine/power_core_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';
import {
    getMutableEncounterStateForTest,
} from './get_mutable_encounter_state_for_test';

const AIM_DURATION_MS = 3000;

describe(
    'Weapons defense turret command',
    () => {
        it(
            'offers one INTERCEPT command for an incoming missile',
            () => {
                const {
                    engine,
                } = createEngineWithIncomingMissile();

                expect(
                    engine.getAvailableCommands(
                        OFFICER_ROLE.WEAPONS,
                    ),
                ).toEqual([
                    {
                        commandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .WEAPONS_INTERCEPT_MISSILE,

                        label:
                            'INTERCEPT',

                        target: {
                            kind:
                                OFFICER_COMMAND_TARGET_KIND
                                    .THREAT,

                            threatId:
                                'projectile_1',
                        },

                        targetLabel:
                            'MISSILE M1',
                    },
                ]);
            },
        );

        it(
            'guarantees interception for a correct concrete Science hypothesis',
            () => {
                const {
                    engine,
                    state,
                } = createEngineWithIncomingMissile({
                    // Above the BASIC blind chance; only the correct
                    // hypothesis should make this shot guaranteed.
                    random: () => 0.99,
                });

                const projectile =
                    state.combat
                        .projectiles[0];

                if (!projectile) {
                    throw new Error(
                        'Expected incoming missile',
                    );
                }

                projectile.identification = {
                    status:
                        MISSILE_SIGNATURE_INTEL_STATUS
                            .UNCERTAIN,

                    hypothesis:
                        projectile.signature,
                };

                executeIntercept(
                    engine,
                );

                expect(
                    state.combat.powerCore,
                ).toMatchObject({
                    charges: 3,
                });

                engine.drainEvents();
                engine.step(
                    AIM_DURATION_MS,
                );

                const ended =
                    engine.drainEvents()
                        .find((event) => {
                            return (
                                event.type ===
                                ENCOUNTER_EVENT
                                    .OFFICER_TASK_ENDED
                            );
                        });

                expect(ended)
                    .toMatchObject({
                        result: {
                            kind:
                                OFFICER_TASK_RESULT_KIND
                                    .DEFENSE_TURRET_FIRED,

                            threatId:
                                projectile.id,

                            outcome:
                                DEFENSE_TURRET_SHOT_OUTCOME
                                    .HIT,
                        },
                    });

                expect(
                    state.combat.projectiles,
                ).toEqual([]);
            },
        );

        it(
            'uses equipment blind chance without a hypothesis and keeps a missile after a miss',
            () => {
                const {
                    engine,
                    state,
                } = createEngineWithIncomingMissile({
                    random: () => 0.99,
                });

                executeIntercept(
                    engine,
                );

                engine.drainEvents();
                engine.step(
                    AIM_DURATION_MS,
                );

                const ended =
                    engine.drainEvents()
                        .find((event) => {
                            return (
                                event.type ===
                                ENCOUNTER_EVENT
                                    .OFFICER_TASK_ENDED
                            );
                        });

                expect(ended)
                    .toMatchObject({
                        result: {
                            kind:
                                OFFICER_TASK_RESULT_KIND
                                    .DEFENSE_TURRET_FIRED,

                            outcome:
                                DEFENSE_TURRET_SHOT_OUTCOME
                                    .MISS,
                        },
                    });

                expect(
                    state.combat.projectiles,
                ).toHaveLength(1);

                expect(
                    engine.getAvailableCommands(
                        OFFICER_ROLE.WEAPONS,
                    ),
                ).toHaveLength(1);
            },
        );

        it(
            'does not offer INTERCEPT without a shared defensive charge',
            () => {
                const {
                    engine,
                } = createEngineWithIncomingMissile({
                    powerCore:
                        createPowerCoreFixture(
                            0,
                        ),
                });

                expect(
                    engine.getAvailableCommands(
                        OFFICER_ROLE.WEAPONS,
                    ),
                ).toEqual([]);
            },
        );

        it(
            'does not refund the spent charge when the target disappears',
            () => {
                const {
                    engine,
                    state,
                } = createEngineWithIncomingMissile();

                executeIntercept(
                    engine,
                );

                engine.drainEvents();

                state.combat
                    .projectiles
                    .length = 0;

                engine.step(
                    AIM_DURATION_MS,
                );

                expect(
                    state.combat.powerCore,
                ).toMatchObject({
                    charges: 3,
                });
            },
        );
    },
);

type CreateScenarioOptions = {
    powerCore?:
        PowerCoreState;

    random?:
        () => number;
};

function createEngineWithIncomingMissile({
    powerCore =
        createPowerCoreFixture(),

    random =
        () => 0,
}: CreateScenarioOptions = {}) {
    const {
        node,
        stationId,
    } = createSingleStationNodeFixture();

    const enemy =
        ShipNodeActorFactory.create({
            id:
                'ship_enemy_00',

            presetId:
                SHIP_NODE_ACTOR_PRESET_ID
                    .ENEMY_GENERIC_00,

            anchorId:
                stationId,
        });

    const launcher =
        enemy.weapons[0];

    if (
        launcher.kind !==
        SHIP_WEAPON_KIND
            .MISSILE_LAUNCHER
    ) {
        throw new Error(
            'Expected enemy missile launcher',
        );
    }

    launcher.ammoCount = 1;
    node.actors.push(enemy);

    const engine =
        new EncounterEngine({
            playerHull:
                createPlayerHullFixture(),

            drive:
                createShipDriveFixture(),

            defenseTurret:
                ShipDefenseTurretFactory.create({
                    id:
                        'defense_turret_player_00',

                    defenseTurretId:
                        DEFENSE_TURRET_ID
                            .BASIC_00,
                }),

            powerCore,
            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    stationId,
            },

            random,
        });

    engine.drainEvents();
    engine.step(1);
    engine.drainEvents();

    engine.step(
        SHIP_WEAPON_TARGETING_DURATION_MS -
            1,
    );

    engine.drainEvents();

    return {
        engine,
        state:
            getMutableEncounterStateForTest(
                engine,
            ),
    };
}

function executeIntercept(
    engine: EncounterEngine,
): void {
    const command =
        engine.getAvailableCommands(
            OFFICER_ROLE.WEAPONS,
        )
        .find((candidate) => {
            return (
                candidate.commandId ===
                ENCOUNTER_OFFICER_COMMAND_ID
                    .WEAPONS_INTERCEPT_MISSILE
            );
        });

    if (!command) {
        throw new Error(
            'Expected INTERCEPT command',
        );
    }

    expect(
        engine.executeCommand({
            role:
                OFFICER_ROLE.WEAPONS,

            commandId:
                command.commandId,

            target:
                command.target,
        }),
    ).toEqual({
        status:
            OFFICER_COMMAND_EXECUTION_STATUS
                .EXECUTED,
    });
}
