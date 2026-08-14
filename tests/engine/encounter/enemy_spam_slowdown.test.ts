import {
    MISSILE_SIGNATURE,
} from '../../../src/engine/defs/missile';
// tests/engine/encounter/enemy_spam_slowdown.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    DEFENSE_TURRETS,
} from '../../../src/engine/content/catalogs/defense_turrets';
import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    DEFENSE_TURRET_PHASE,
} from '../../../src/engine/defs/defense_turret';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_PHASE,
    type MissileLauncherState,
} from '../../../src/engine/defs/ship_weapon';
import {
    STICKY_MINE_ID,
} from '../../../src/engine/defs/sticky_mine';
import MissileLauncherFactory from '../../../src/engine/generation/ship_weapon/MissileLauncherFactory';
import {
    spendPowerCoreCharge,
} from '../../../src/engine/encounter/combat/defense/spend_power_core_charge';
import {
    getActiveCrewProgressEffects,
} from '../../../src/engine/encounter/crew_performance/get_active_crew_progress_effects';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import {
    createAnchoredPlayerCombatTestSetup,
    type AnchoredPlayerCombatTestSetup,
} from './combat_test_support';

describe(
    'Player spam slowdown on enemy crew',
    () => {
        it(
            'halves timed enemy crew-task progress',
            () => {
                const setup =
                    createAnchoredPlayerCombatTestSetup();

                makeEnemyPassive(
                    setup,
                );

                activatePlayerSpam(
                    setup,
                );

                setup.targetActor
                    .crewRoles = [
                        OFFICER_ROLE
                            .ENGINEER,
                    ];

                setup.targetActor
                    .crewTasks = {
                        [OFFICER_ROLE
                            .ENGINEER]: {
                            kind:
                                SHIP_CREW_TASK_KIND
                                    .CLEAR_STICKY_MINE,

                            role:
                                OFFICER_ROLE
                                    .ENGINEER,

                            mineId:
                                'spam_slow_mine',

                            elapsedMs: 0,
                            durationMs: 3000,
                        },
                    };

                setup.state.combat
                    .stickyMines
                    .push({
                        id:
                            'spam_slow_mine',

                        mineId:
                            STICKY_MINE_ID
                                .BASIC_00,

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
                                setup.targetActor
                                    .id,
                        },

                        timeToDetonationMs:
                            10000,

                        initialTimeToDetonationMs:
                            10000,

                        damage: 1,
                    });

                setup.engine.step(
                    3000,
                );

                expect(
                    setup.targetActor
                        .crewTasks[
                            OFFICER_ROLE
                                .ENGINEER
                        ],
                ).toMatchObject({
                    elapsedMs: 1500,
                    durationMs: 3000,
                });

                expect(
                    setup.state.combat
                        .stickyMines,
                ).toHaveLength(1);

                expect(
                    setup.engine
                        .getEnemyDebugSnapshots()[0]
                        ?.crewProgressMultiplier,
                ).toBe(0.5);

                setup.engine.step(
                    3000,
                );

                expect(
                    setup.targetActor
                        .crewTasks[
                            OFFICER_ROLE
                                .ENGINEER
                        ],
                ).toBeUndefined();

                expect(
                    setup.state.combat
                        .stickyMines,
                ).toEqual([]);
            },
        );

        it(
            'halves enemy weapon targeting progress',
            () => {
                const setup =
                    createAnchoredPlayerCombatTestSetup();

                const launcher =
                    createEnemyMissileLauncher();

                makeEnemyPassive(
                    setup,
                );

                activatePlayerSpam(
                    setup,
                );

                launcher.phase =
                    SHIP_WEAPON_PHASE
                        .TARGETING;

                launcher.phaseElapsedMs =
                    0;

                setup.targetActor
                    .crewRoles = [
                        OFFICER_ROLE.WEAPONS,
                    ];

                setup.targetActor
                    .crewTasks = {
                        [OFFICER_ROLE.WEAPONS]: {
                            kind:
                                SHIP_CREW_TASK_KIND
                                    .OPERATE_WEAPON,

                            role:
                                OFFICER_ROLE
                                    .WEAPONS,

                            weaponId:
                                launcher.id,
                        },
                    };

                setup.targetActor
                    .weapons = [
                        launcher,
                    ];

                setup.engine.step(
                    SHIP_WEAPON_TARGETING_DURATION_MS,
                );

                expect(
                    launcher.phase,
                ).toBe(
                    SHIP_WEAPON_PHASE
                        .TARGETING,
                );

                expect(
                    launcher.phaseElapsedMs,
                ).toBe(
                    SHIP_WEAPON_TARGETING_DURATION_MS *
                        0.5,
                );

                expect(
                    setup.state.combat
                        .projectiles,
                ).toEqual([]);

                setup.engine.step(
                    SHIP_WEAPON_TARGETING_DURATION_MS,
                );

                expect(
                    launcher.phase,
                ).toBe(
                    SHIP_WEAPON_PHASE
                        .COOLDOWN,
                );

                expect(
                    setup.state.combat
                        .projectiles,
                ).toContainEqual(
                    expect.objectContaining({
                        source:
                            expect.objectContaining({
                                kind:
                                    COMBAT_SOURCE_KIND
                                        .ACTOR,

                                actorId:
                                    setup.targetActor
                                        .id,
                            }),
                    }),
                );
            },
        );

        it(
            'halves enemy defense-turret loading progress',
            () => {
                const setup =
                    createAnchoredPlayerCombatTestSetup();

                const defenseTurret =
                    setup.targetActor
                        .defenseTurret;

                if (!defenseTurret) {
                    throw new Error(
                        'Expected enemy defense turret',
                    );
                }

                makeEnemyPassive(
                    setup,
                );

                activatePlayerSpam(
                    setup,
                );

                const projectileId =
                    'spam_slow_pd_missile';

                setup.state.combat
                    .projectiles
                    .push({
                        id:
                            projectileId,

                        designation:
                            'M-SPAM',

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
                                setup.targetActor
                                    .id,
                        },

                        signature:
                MISSILE_SIGNATURE.A,

            identification: {
                            status:
                                MISSILE_SIGNATURE_INTEL_STATUS
                                    .CONFIRMED,

                            hypothesis:
                                MISSILE_SIGNATURE.A,
                        },

                        damage: 1,

                        timeToImpactMs:
                            60000,

                        initialTimeToImpactMs:
                            60000,
                    });

                defenseTurret.phase =
                    DEFENSE_TURRET_PHASE
                        .LOADING;

                defenseTurret.phaseElapsedMs =
                    0;


                defenseTurret.targetProjectileId =
                    projectileId;

                const powerCore =
                    setup.targetActor
                        .powerCore;

                if (!powerCore) {
                    throw new Error(
                        'Expected enemy power core',
                    );
                }

                const chargesBefore =
                    powerCore
                        .charges;

                // Этот тест вручную ставит enemy Defense Turret
                // уже в LOADING, обходя scheduler.
                // В production scheduler списывает DEF
                // именно при старте loading, поэтому
                // повторяем тот же commit явно.
                spendPowerCoreCharge(
                    powerCore,
                );

                expect(
                    powerCore
                        .charges,
                ).toBe(
                    chargesBefore - 1,
                );

                setup.targetActor
                    .defenseTurret =
                        defenseTurret;

                setup.targetActor
                    .crewRoles = [
                        OFFICER_ROLE.WEAPONS,
                    ];

                setup.targetActor
                    .crewTasks = {
                        [OFFICER_ROLE.WEAPONS]: {
                            kind:
                                SHIP_CREW_TASK_KIND
                                    .INTERCEPT_MISSILE,

                            role:
                                OFFICER_ROLE
                                    .WEAPONS,

                            defenseTurretId:
                                defenseTurret.id,

                            projectileId,
                        },
                    };

                const definition =
                    DEFENSE_TURRETS[
                        defenseTurret
                            .defenseTurretId
                    ];

                setup.engine.step(
                    definition
                        .loadDurationMs,
                );

                expect(
                    defenseTurret.phase,
                ).toBe(
                    DEFENSE_TURRET_PHASE
                        .LOADING,
                );

                expect(
                    defenseTurret.phaseElapsedMs,
                ).toBe(
                    definition
                        .loadDurationMs *
                        0.5,
                );

                expect(
                    powerCore
                        .charges,
                ).toBe(
                    chargesBefore - 1,
                );

                setup.engine.step(
                    definition
                        .loadDurationMs,
                );

                expect(
                    defenseTurret.phase,
                ).toBe(
                    DEFENSE_TURRET_PHASE
                        .COOLDOWN,
                );

                expect(
                    powerCore
                        .charges,
                ).toBe(
                    chargesBefore - 1,
                );
            },
        );
    },
);

function makeEnemyPassive(
    setup:
        AnchoredPlayerCombatTestSetup,
): void {
    setup.targetActor.crewRoles =
        [];

    setup.targetActor.crewTasks =
        {};

    setup.targetActor.weapons =
        [];

    delete setup.targetActor
        .defenseTurret;
}

function activatePlayerSpam(
    setup:
        AnchoredPlayerCombatTestSetup,
): void {
    const command =
        setup.engine
            .getAvailableCommands(
                OFFICER_ROLE.SCIENCE,
            )
            .find((candidate) => {
                return (
                    candidate.commandId ===
                    ENCOUNTER_OFFICER_COMMAND_ID
                        .SCIENCE_FIRE_SPAM
                );
            });

    if (!command) {
        throw new Error(
            'Expected SCIENCE FIRE SPAM command',
        );
    }

    expect(
        setup.engine.executeCommand({
            role:
                OFFICER_ROLE.SCIENCE,

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

    setup.engine.drainEvents();

    setup.engine.step(
        SHIP_WEAPON_TARGETING_DURATION_MS,
    );

    expect(
        setup.engine
            .drainEvents(),
    ).toContainEqual(
        expect.objectContaining({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_SPAM_CHANNEL_STARTED,

            targetActorId:
                setup.targetActor.id,
        }),
    );

    expect(
        getActiveCrewProgressEffects(
            setup.state,
        ),
    ).toContainEqual(
        expect.objectContaining({
            source: {
                kind:
                    COMBAT_SOURCE_KIND
                        .PLAYER_SHIP,
            },

            target: {
                kind:
                    COMBAT_TARGET_KIND
                        .ACTOR,

                actorId:
                    setup.targetActor.id,
            },

            progressMultiplier:
                0.5,
        }),
    );
}

function createEnemyMissileLauncher():
    MissileLauncherState {
    return MissileLauncherFactory.create({
        id:
            'spam_slow_enemy_missile_launcher',

        weaponId:
            SHIP_WEAPON_ID
                .MISSILE_LAUNCHER_00,
    });
}
