import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    SHIELD_GENERATOR_PHASE,
} from '../../../src/engine/defs/shield_generator';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type LaserWeaponState,
} from '../../../src/engine/defs/ship_weapon';
import {
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    PLAYER_SHIELD_END_OUTCOME,
} from '../../../src/engine/encounter/model/event';
import {
    LASER_SHOT_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    createAnchoredPlayerCombatTestSetup,
} from './combat_test_support';

describe(
    'player shield deploy',
    () => {
        it(
            'spends DEF at task start and does not refund cancellation',
            () => {
                const {
                    engine,
                    state,
                } =
                    createAnchoredPlayerCombatTestSetup();

                const command =
                    engine
                        .getAvailableCommands(
                            OFFICER_ROLE
                                .ENGINEER,
                        )
                        .find((candidate) => {
                            return (
                                candidate.commandId ===
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .ENGINEER_DEPLOY_SHIELD
                            );
                        });

                expect(command).toBeDefined();

                const beforeCharges =
                    state.combat
                        .powerCore
                        ?.charges;

                if (
                    beforeCharges ===
                    undefined
                ) {
                    throw new Error(
                        'Expected player DEF powerCore',
                    );
                }

                engine.executeCommand({
                    role:
                        OFFICER_ROLE.ENGINEER,

                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .ENGINEER_DEPLOY_SHIELD,

                    target: {
                        kind:
                            OFFICER_COMMAND_TARGET_KIND
                                .NONE,
                    },
                });

                expect(
                    state.combat
                        .powerCore
                        ?.charges,
                ).toBe(
                    beforeCharges - 1,
                );

                expect(
                    state.combat
                        .activeShield,
                ).toBeNull();

                const task =
                    engine
                        .getOfficerTasks()
                        .find((candidate) => {
                            return (
                                candidate.role ===
                                OFFICER_ROLE
                                    .ENGINEER
                            );
                        });

                if (!task) {
                    throw new Error(
                        'Expected deploy shield task',
                    );
                }

                engine.cancelTask(
                    task.id,
                );

                expect(
                    state.combat
                        .powerCore
                        ?.charges,
                ).toBe(
                    beforeCharges - 1,
                );

                expect(
                    state.combat
                        .activeShield,
                ).toBeNull();

                expect(
                    state.combat
                        .shieldGenerator
                        ?.phase,
                ).toBe(
                    SHIELD_GENERATOR_PHASE
                        .READY,
                );

                const events =
                    engine.drainEvents();

                expect(
                    events.some((event) => {
                        return (
                            event.type ===
                                ENCOUNTER_EVENT
                                    .OFFICER_TASK_ENDED &&
                            event.outcome ===
                                OFFICER_TASK_OUTCOME
                                    .CANCELLED
                        );
                    }),
                ).toBe(true);
            },
        );

        it(
            'deploys a five-second active shield on task completion',
            () => {
                const {
                    engine,
                    state,
                } =
                    createAnchoredPlayerCombatTestSetup();

                engine.executeCommand({
                    role:
                        OFFICER_ROLE.ENGINEER,

                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .ENGINEER_DEPLOY_SHIELD,

                    target: {
                        kind:
                            OFFICER_COMMAND_TARGET_KIND
                                .NONE,
                    },
                });

                engine.step(3000);

                const deployedEvent =
                    engine
                        .drainEvents()
                        .find((event) => {
                            return (
                                event.type ===
                                ENCOUNTER_EVENT
                                    .PLAYER_SHIELD_DEPLOYED
                            );
                        });

                expect(
                    deployedEvent,
                ).toEqual({
                    type:
                        ENCOUNTER_EVENT
                            .PLAYER_SHIELD_DEPLOYED,

                    shield: {
                        sourceEmitterId:
                            'shield_generator_player_00',

                        remainingDurationMs:
                            5000,

                        initialDurationMs:
                            5000,
                    },
                });

                expect(
                    state.combat
                        .activeShield,
                ).toEqual({
                    sourceEmitterId:
                        'shield_generator_player_00',

                    remainingDurationMs:
                        5000,

                    initialDurationMs:
                        5000,
                });

                expect(
                    state.combat
                        .shieldGenerator
                        ?.phase,
                ).toBe(
                    SHIELD_GENERATOR_PHASE
                        .COOLDOWN,
                );

                engine.step(4999);

                expect(
                    state.combat
                        .activeShield
                        ?.remainingDurationMs,
                ).toBe(1);

                engine.step(1);

                const expiredEvent =
                    engine
                        .drainEvents()
                        .find((event) => {
                            return (
                                event.type ===
                                ENCOUNTER_EVENT
                                    .PLAYER_SHIELD_ENDED
                            );
                        });

                expect(
                    expiredEvent,
                ).toEqual({
                    type:
                        ENCOUNTER_EVENT
                            .PLAYER_SHIELD_ENDED,

                    shield: {
                        sourceEmitterId:
                            'shield_generator_player_00',

                        remainingDurationMs:
                            0,

                        initialDurationMs:
                            5000,
                    },

                    outcome:
                        PLAYER_SHIELD_END_OUTCOME
                            .EXPIRED,
                });

                expect(
                    state.combat
                        .activeShield,
                ).toBeNull();

                expect(
                    state.combat
                        .shieldGenerator
                        ?.phase,
                ).toBe(
                    SHIELD_GENERATOR_PHASE
                        .READY,
                );
            },
        );

        it(
            'absorbs one incoming laser without hull damage',
            () => {
                const {
                    engine,
                    state,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

                engine.executeCommand({
                    role:
                        OFFICER_ROLE.ENGINEER,

                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .ENGINEER_DEPLOY_SHIELD,

                    target: {
                        kind:
                            OFFICER_COMMAND_TARGET_KIND
                                .NONE,
                    },
                });

                engine.step(3000);
                engine.drainEvents();

                const laser:
                    LaserWeaponState = {
                        id:
                            'shield_test_laser_00',

                        weaponId:
                            SHIP_WEAPON_ID
                                .LASER_00,

                        kind:
                            SHIP_WEAPON_KIND
                                .LASER,

                        phase:
                            SHIP_WEAPON_PHASE
                                .READY,

                        phaseElapsedMs: 0,
                    };

                targetActor.weapons.push(
                    laser,
                );

                const definition =
                    SHIP_WEAPONS[
                        laser.weaponId
                    ];

                if (
                    definition.kind !==
                    SHIP_WEAPON_KIND.LASER
                ) {
                    throw new Error(
                        'Expected laser definition',
                    );
                }

                laser.phase =
                    SHIP_WEAPON_PHASE
                        .CHARGING;

                laser.phaseElapsedMs =
                    definition
                        .chargeDurationMs;

                state.combat
                    .laserAttacks =
                        state.combat
                            .laserAttacks
                            .filter((attack) => {
                                return !(
                                    attack.sourceActorId ===
                                        targetActor.id &&
                                    attack.sourceWeaponId ===
                                        laser.id
                                );
                            });

                state.combat
                    .laserAttacks
                    .push({
                        id:
                            'shield_test_laser',

                        designation:
                            'L99',

                        sourceActorId:
                            targetActor.id,

                        sourceWeaponId:
                            laser.id,

                        target: {
                            kind:
                                'player_ship',
                        },
                    });

                const hullBefore =
                    state.playerHull.hull;

                engine.step(0);

                expect(
                    state.playerHull.hull,
                ).toBe(
                    hullBefore,
                );

                expect(
                    state.combat
                        .activeShield,
                ).toBeNull();

                const events =
                    engine
                        .drainEvents();

                const firedEvent =
                    events.find((event) => {
                        return (
                            event.type ===
                                ENCOUNTER_EVENT
                                    .LASER_FIRED &&
                            event.attack.id ===
                                'shield_test_laser'
                        );
                    });

                const shieldEndedEvent =
                    events.find((event) => {
                        return (
                            event.type ===
                            ENCOUNTER_EVENT
                                .PLAYER_SHIELD_ENDED
                        );
                    });

                expect(
                    firedEvent,
                ).toMatchObject({
                    type:
                        ENCOUNTER_EVENT
                            .LASER_FIRED,

                    outcome:
                        LASER_SHOT_OUTCOME
                            .ABSORBED,
                });

                expect(
                    shieldEndedEvent,
                ).toEqual({
                    type:
                        ENCOUNTER_EVENT
                            .PLAYER_SHIELD_ENDED,

                    shield: {
                        sourceEmitterId:
                            'shield_generator_player_00',

                        remainingDurationMs:
                            5000,

                        initialDurationMs:
                            5000,
                    },

                    outcome:
                        PLAYER_SHIELD_END_OUTCOME
                            .ABSORBED,
                });
            },
        );
    },
);
