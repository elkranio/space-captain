import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    SHIELD_GENERATORS,
} from '../../../src/engine/content/catalogs/shield_generators';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import {
    SHIELD_GENERATOR_ID,
    SHIELD_GENERATOR_PHASE,
} from '../../../src/engine/defs/shield_generator';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type BeamCannonState,
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
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import {
    BEAM_CANNON_SHOT_OUTCOME,
    BEAM_CANNON_TARGET_NODE,
} from '../../../src/engine/encounter/model/combat';
import {
    createAnchoredPlayerCombatTestSetup,
} from './combat_test_support';

const DEPLOY_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .ENGINEER_DEPLOY_SHIELD,
    );
const SHIELD_DEFINITION =
    SHIELD_GENERATORS[
        SHIELD_GENERATOR_ID.BASIC_00
    ];

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
                                .PLAYER_SHIP_NODE,

                        targetNode:
                            BEAM_CANNON_TARGET_NODE
                                .HULL,
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
                        .COOLDOWN,
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
                                .PLAYER_SHIP_NODE,

                        targetNode:
                            BEAM_CANNON_TARGET_NODE
                                .HULL,
                    },
                });

                engine.step(
                    DEPLOY_DURATION_MS,
                );

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

                        targetNode:
                            BEAM_CANNON_TARGET_NODE
                                .HULL,

                        remainingDurationMs:
                            SHIELD_DEFINITION.shieldDurationMs,

                        initialDurationMs:
                            SHIELD_DEFINITION.shieldDurationMs,
                    },
                });

                expect(
                    state.combat
                        .activeShield,
                ).toEqual({
                    sourceEmitterId:
                        'shield_generator_player_00',

                    targetNode:
                        BEAM_CANNON_TARGET_NODE
                            .HULL,

                    remainingDurationMs:
                        SHIELD_DEFINITION.shieldDurationMs,

                    initialDurationMs:
                        SHIELD_DEFINITION.shieldDurationMs,
                });

                expect(
                    state.combat
                        .shieldGenerator
                        ?.phase,
                ).toBe(
                    SHIELD_GENERATOR_PHASE
                        .COOLDOWN,
                );

                engine.step(
                    SHIELD_DEFINITION
                        .shieldDurationMs - 1,
                );

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

                        targetNode:
                            BEAM_CANNON_TARGET_NODE
                                .HULL,

                        remainingDurationMs:
                            0,

                        initialDurationMs:
                            SHIELD_DEFINITION.shieldDurationMs,
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
            'absorbs one incoming beamCannon without hull damage',
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
                                .PLAYER_SHIP_NODE,

                        targetNode:
                            BEAM_CANNON_TARGET_NODE
                                .HULL,
                    },
                });

                engine.step(
                    DEPLOY_DURATION_MS,
                );
                engine.drainEvents();

                const beamCannon:
                    BeamCannonState = {
                        id:
                            'shield_test_beam_cannon_00',

                        weaponId:
                            SHIP_WEAPON_ID
                                .BEAM_CANNON_00,

                        kind:
                            SHIP_WEAPON_KIND
                                .BEAM_CANNON,

                        phase:
                            SHIP_WEAPON_PHASE
                                .READY,

                        phaseElapsedMs: 0,
                        cooldownRemainingMs: 0,
                    };

                targetActor.weapons.push(
                    beamCannon,
                );

                const definition =
                    SHIP_WEAPONS[
                        beamCannon.weaponId
                    ];

                if (
                    definition.kind !==
                    SHIP_WEAPON_KIND.BEAM_CANNON
                ) {
                    throw new Error(
                        'Expected beamCannon definition',
                    );
                }

                beamCannon.phase =
                    SHIP_WEAPON_PHASE
                        .CHARGING;

                beamCannon.phaseElapsedMs =
                    definition
                        .chargeDurationMs;

                state.combat
                    .beamCannonAttacks =
                        state.combat
                            .beamCannonAttacks
                            .filter((attack) => {
                                return !(
                                    attack.sourceActorId ===
                                        targetActor.id &&
                                    attack.sourceWeaponId ===
                                        beamCannon.id
                                );
                            });

                state.combat
                    .beamCannonAttacks
                    .push({
                        id:
                            'shield_test_beam_cannon',

                        designation:
                            'L99',

                        sourceActorId:
                            targetActor.id,

                        sourceWeaponId:
                            beamCannon.id,

                        target: {
                            kind:
                                'player_ship',
                        },

                        targetNode:
                            BEAM_CANNON_TARGET_NODE
                                .HULL,
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
                                    .BEAM_CANNON_FIRED &&
                            event.attack.id ===
                                'shield_test_beam_cannon'
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
                            .BEAM_CANNON_FIRED,

                    outcome:
                        BEAM_CANNON_SHOT_OUTCOME
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

                        targetNode:
                            BEAM_CANNON_TARGET_NODE
                                .HULL,

                        remainingDurationMs:
                            SHIELD_DEFINITION.shieldDurationMs,

                        initialDurationMs:
                            SHIELD_DEFINITION.shieldDurationMs,
                    },

                    outcome:
                        PLAYER_SHIELD_END_OUTCOME
                            .ABSORBED,
                });
            },
        );
    },
);
