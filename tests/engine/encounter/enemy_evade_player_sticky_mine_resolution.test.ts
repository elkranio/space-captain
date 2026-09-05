import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    SHIP_EVADE_PHASE,
} from '../../../src/engine/defs/ship_evade';
import {
    SHIP_WEAPON_KIND,
} from '../../../src/engine/defs/ship_weapon';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import {
    createAnchoredPlayerCombatTestSetup,
    getPlayerWeaponOrThrow,
} from './combat_test_support';

const MINE_TARGETING_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .GUNNER_FIRE_STICKY_MINES,
    );

describe(
    'enemy Evade player sticky-mine resolution',
    () => {
        it(
            'resolves the attachment attempt as MISS without creating an attached mine',
            () => {
                const {
                    engine,
                    state,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

                targetActor.crewRoles = [];
                targetActor.weapons = [];

                targetActor.evade.phase =
                    SHIP_EVADE_PHASE
                        .EVADING;

                targetActor.evade.phaseElapsedMs =
                    0;

                targetActor.evade.cooldownRemainingMs =
                    60_000;

                const dispenser =
                    getPlayerWeaponOrThrow(
                        state,
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER,
                    );

                const initialAmmo =
                    dispenser.ammoCount;

                const command =
                    engine
                        .getAvailableCommands(
                            OFFICER_ROLE.GUNNER,
                        )
                        .find(
                            (candidate) => {
                                return (
                                    candidate.commandId ===
                                        ENCOUNTER_OFFICER_COMMAND_ID
                                            .GUNNER_FIRE_STICKY_MINES &&
                                    candidate.target.kind ===
                                        OFFICER_COMMAND_TARGET_KIND
                                            .ACTOR_WEAPON &&
                                    candidate.target.weaponId ===
                                        dispenser.id &&
                                    candidate.target.actorId ===
                                        targetActor.id
                                );
                            },
                        );

                if (!command) {
                    throw new Error(
                        'Expected FIRE MINES command',
                    );
                }

                engine.drainEvents();

                expect(
                    engine.executeCommand({
                        role:
                            OFFICER_ROLE.GUNNER,

                        commandId:
                            command.commandId,

                        target:
                            command.target,
                    }),
                ).toMatchObject({
                    status:
                        'executed',
                });

                // Player mine attachment has no engine-side flight.
                // The first physical attempt resolves when Gunner finishes aiming.
                engine.step(
                    MINE_TARGETING_DURATION_MS,
                );

                const events =
                    engine.drainEvents();

                expect(
                    events,
                ).toContainEqual({
                    type:
                        ENCOUNTER_EVENT
                            .PLAYER_STICKY_MINE_MISSED,

                    mineId:
                        expect.any(
                            String,
                        ),

                    sourceWeaponId:
                        dispenser.id,

                    targetActorId:
                        targetActor.id,
                });

                expect(
                    events.some(
                        (event) => {
                            return (
                                event.type ===
                                ENCOUNTER_EVENT
                                    .PLAYER_STICKY_MINE_ATTACHED
                            );
                        },
                    ),
                ).toBe(
                    false,
                );

                expect(
                    engine
                        .getCombatPresentationSnapshot()
                        .outgoingStickyMines,
                ).toEqual(
                    [],
                );

                expect(
                    dispenser.ammoCount,
                ).toBe(
                    initialAmmo -
                        1,
                );

                expect(
                    dispenser.dispensedMineCount,
                ).toBe(
                    1,
                );
            },
        );
    },
);
