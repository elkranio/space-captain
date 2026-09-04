import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    DEFENSE_TURRETS,
} from '../../../src/engine/content/catalogs/defense_turrets';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    DEFENSE_TURRET_ID,
    DEFENSE_TURRET_PHASE,
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
    ENCOUNTER_EVENT,
    OFFICER_TASK_RESULT_KIND,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
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
import { getTestMissileTargetingDurationMs } from './combat_test_support';

const AIM_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .GUNNER_DEFENSE_TURRET,
    );
const COOLDOWN_DURATION_MS =
    DEFENSE_TURRETS[
        DEFENSE_TURRET_ID.BASIC_00
    ].cooldownDurationMs;

describe(
    'Gunner defense turret command',
    () => {
        it(
            'offers one INTERCEPT command for an incoming missile',
            () => {
                const {
                    engine,
                } = createEngineWithIncomingMissile();

                expect(
                    engine.getAvailableCommands(
                        OFFICER_ROLE.GUNNER,
                    ),
                ).toEqual([
                    {
                        commandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .GUNNER_INTERCEPT_MISSILE,

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
            'keeps INTERCEPT available after the missile source actor is gone',
            () => {
                const {
                    engine,
                    state,
                } =
                    createEngineWithIncomingMissile();

                const projectile =
                    state.combat
                        .projectiles[0];

                if (!projectile) {
                    throw new Error(
                        'Expected incoming missile',
                    );
                }

                // Mirrors enemy destruction: the already-launched
                // projectile survives after its source actor is removed.
                state.actors.length = 0;

                expect(
                    engine.getAvailableCommands(
                        OFFICER_ROLE.GUNNER,
                    ),
                ).toContainEqual({
                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .GUNNER_INTERCEPT_MISSILE,

                    label:
                        'INTERCEPT',

                    target: {
                        kind:
                            OFFICER_COMMAND_TARGET_KIND
                                .THREAT,

                        threatId:
                            projectile.id,
                    },

                    targetLabel:
                        'MISSILE ' +
                        projectile.designation,
                });
            },
        );

        it(
            'resolves a completed INTERCEPT task as a hit',
            () => {
                const {
                    engine,
                    state,
                } = createEngineWithIncomingMissile();

                const chargesBefore = state.combat.powerCore!.charges;
                executeIntercept(engine);

                expect(
                    state.combat.powerCore,
                ).toMatchObject({
                    charges: chargesBefore - 1,
                });

                expect(
                    state.combat.defenseTurret,
                ).toMatchObject({
                    phase:
                        DEFENSE_TURRET_PHASE.LOADING,

                    phaseElapsedMs: 0,
                    cooldownRemainingMs: 0,
                    targetProjectileId:
                        'projectile_1',
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

                            outcome:
                                DEFENSE_TURRET_SHOT_OUTCOME
                                    .HIT,
                        },
                    });

                expect(
                    state.combat.projectiles,
                ).toEqual([]);

                expect(
                    engine.getAvailableCommands(
                        OFFICER_ROLE.GUNNER,
                    ),
                ).toEqual([]);

                expect(
                    state.combat.defenseTurret,
                ).toMatchObject({
                    phase:
                        DEFENSE_TURRET_PHASE.COOLDOWN,

                    phaseElapsedMs: 0,
                    cooldownRemainingMs:
                        COOLDOWN_DURATION_MS,
                    targetProjectileId:
                        null,
                });

                engine.step(
                    COOLDOWN_DURATION_MS,
                );

                expect(
                    state.combat.defenseTurret,
                ).toMatchObject({
                    phase:
                        DEFENSE_TURRET_PHASE.READY,

                    phaseElapsedMs: 0,
                    cooldownRemainingMs: 0,
                });
            },
        );

        it(
            'does not offer INTERCEPT with a broken Defense Turret',
            () => {
                const {
                    engine,
                    state,
                } = createEngineWithIncomingMissile();

                const defenseTurret =
                    state.combat.defenseTurret;

                if (!defenseTurret) {
                    throw new Error(
                        'Expected player Defense Turret',
                    );
                }

                defenseTurret.integrity = 0;

                expect(
                    engine.getAvailableCommands(
                        OFFICER_ROLE.GUNNER,
                    ),
                ).toEqual([]);
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
                        OFFICER_ROLE.GUNNER,
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

                const chargesBefore = state.combat.powerCore!.charges;
                executeIntercept(engine);

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
                    charges: chargesBefore - 1,
                });

                expect(
                    state.combat.defenseTurret,
                ).toMatchObject({
                    phase:
                        DEFENSE_TURRET_PHASE.COOLDOWN,

                    phaseElapsedMs: 0,
                    cooldownRemainingMs:
                        COOLDOWN_DURATION_MS,
                    targetProjectileId:
                        null,
                });
            },
        );

        it(
            'starts a full cooldown when the player cancels INTERCEPT',
            () => {
                const {
                    engine,
                    state,
                } = createEngineWithIncomingMissile();

                const chargesBefore = state.combat.powerCore!.charges;
                executeIntercept(engine);

                const task =
                    engine.getOfficerTasks()[0];

                if (!task) {
                    throw new Error(
                        'Expected Defense Turret task',
                    );
                }

                engine.cancelTask(
                    task.id,
                );

                expect(
                    state.combat.powerCore,
                ).toMatchObject({
                    charges: chargesBefore - 1,
                });

                expect(
                    state.combat.projectiles,
                ).toHaveLength(1);

                expect(
                    state.combat.defenseTurret,
                ).toMatchObject({
                    phase:
                        DEFENSE_TURRET_PHASE.COOLDOWN,

                    phaseElapsedMs: 0,
                    cooldownRemainingMs:
                        COOLDOWN_DURATION_MS,
                    targetProjectileId:
                        null,
                });

                expect(
                    engine.getOfficerTasks(),
                ).toEqual([]);
            },
        );
    },
);

type CreateScenarioOptions = {
    powerCore?:
        PowerCoreState;
};

function createEngineWithIncomingMissile({
    powerCore =
        createPowerCoreFixture(),
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

            random: () => 0,
        });

    engine.drainEvents();
    engine.step(1);
    engine.drainEvents();

    engine.step(
        getTestMissileTargetingDurationMs() -
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
            OFFICER_ROLE.GUNNER,
        )
        .find((candidate) => {
            return (
                candidate.commandId ===
                ENCOUNTER_OFFICER_COMMAND_ID
                    .GUNNER_INTERCEPT_MISSILE
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
                OFFICER_ROLE.GUNNER,

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
