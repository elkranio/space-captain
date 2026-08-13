// tests/engine/encounter/enemy_purge_player_spam.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/defs/officer_task';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EnemyDecisionPolicy from '../../../src/engine/encounter/combat/enemy/EnemyDecisionPolicy';
import {
    getActiveCrewProgressEffects,
} from '../../../src/engine/encounter/crew_performance/get_active_crew_progress_effects';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_SPAM_CHANNEL_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
} from '../../../src/engine/encounter/model/enemy_threat_observation';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import {
    createAnchoredPlayerCombatTestSetup,
    getPlayerWeaponOrThrow,
    type AnchoredPlayerCombatTestSetup,
} from './combat_test_support';

const SCIENCE_PURGE_SPAM_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .SCIENCE_PURGE_SPAM,
    );

describe(
    'Enemy Science purge of player spam',
    () => {
        it(
            'purges the channel after slowed Science work',
            () => {
                const setup =
                    createAnchoredPlayerCombatTestSetup();

                makeEnemyScienceOnly(
                    setup,
                );

                const projector =
                    getPlayerWeaponOrThrow(
                        setup.state,

                        SHIP_WEAPON_KIND
                            .SPAM_PROJECTOR,
                    );

                const channelId =
                    activatePlayerSpam(
                        setup,
                    );

                expect(
                    setup.targetActor
                        .crewTasks[
                            OFFICER_ROLE
                                .SCIENCE
                        ],
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .PURGE_SPAM,

                    role:
                        OFFICER_ROLE.SCIENCE,

                    channelId,

                    elapsedMs: 0,

                    durationMs:
                        SCIENCE_PURGE_SPAM_DURATION_MS,
                });

                const scienceDebug =
                    setup.engine
                        .getEnemyDebugSnapshots()[0]
                        ?.roles
                        .find((role) => {
                            return (
                                role.role ===
                                OFFICER_ROLE
                                    .SCIENCE
                            );
                        });

                expect(
                    scienceDebug?.task,
                ).toMatchObject({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .PURGE_SPAM,

                    label:
                        'PURGE SPAM',

                    progress: {
                        elapsedMs: 0,

                        durationMs:
                            SCIENCE_PURGE_SPAM_DURATION_MS,
                    },
                });

                expect(
                    setup.engine
                        .getEnemyDebugSnapshots()[0]
                        ?.crewProgressMultiplier,
                ).toBe(0.5);

                setup.engine.step(
                    SCIENCE_PURGE_SPAM_DURATION_MS,
                );

                expect(
                    setup.targetActor
                        .crewTasks[
                            OFFICER_ROLE
                                .SCIENCE
                        ],
                ).toMatchObject({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .PURGE_SPAM,

                    elapsedMs:
                        SCIENCE_PURGE_SPAM_DURATION_MS *
                        0.5,
                });

                expect(
                    setup.engine
                        .drainEvents()
                        .some((event) => {
                            return (
                                event.type ===
                                ENCOUNTER_EVENT
                                    .PLAYER_SPAM_CHANNEL_ENDED
                            );
                        }),
                ).toBe(false);

                setup.engine.step(
                    SCIENCE_PURGE_SPAM_DURATION_MS,
                );

                expect(
                    setup.engine.drainEvents(),
                ).toContainEqual({
                    type:
                        ENCOUNTER_EVENT
                            .PLAYER_SPAM_CHANNEL_ENDED,

                    channelId,

                    sourceWeaponId:
                        projector.id,

                    targetActorId:
                        setup.targetActor.id,

                    outcome:
                        PLAYER_SPAM_CHANNEL_OUTCOME
                            .PURGED,
                });

                expect(projector).toMatchObject({
                    phase:
                        SHIP_WEAPON_PHASE
                            .COOLDOWN,

                    phaseElapsedMs: 0,

                    activeChannelId:
                        null,
                });

                expect(
                    setup.engine
                        .getOfficerTasks(),
                ).toEqual([]);

                expect(
                    setup.targetActor
                        .crewTasks[
                            OFFICER_ROLE
                                .SCIENCE
                        ],
                ).toBeUndefined();

                expect(
                    getPlayerSpamEffects(
                        setup,
                    ),
                ).toEqual([]);

                expect(
                    setup.engine
                        .getEnemyDebugSnapshots()[0]
                        ?.crewProgressMultiplier,
                ).toBeUndefined();
            },
        );

        it(
            'prioritizes purge over identification',
            () => {
                const setup =
                    createAnchoredPlayerCombatTestSetup();

                makeEnemyScienceOnly(
                    setup,
                );

                const channelId =
                    activatePlayerSpam(
                        setup,
                    );

                setup.targetActor.crewTasks =
                    {};

                setup.targetActor
                    .threatObservations = [
                        {
                            id:
                                'purge_priority_threat',

                            kind:
                                ENEMY_THREAT_KIND
                                    .MISSILE,

                            source: {
                                kind:
                                    ENEMY_THREAT_SOURCE_KIND
                                        .COMBAT_PROJECTILE,

                                projectileId:
                                    'purge_priority_projectile',
                            },
                        },
                    ];

                const intent =
                    new EnemyDecisionPolicy(
                        () => 0,
                    ).selectWork(
                        setup.targetActor,
                        OFFICER_ROLE.SCIENCE,
                        {
                            threats: [],

                            crewProgressEffects:
                                getActiveCrewProgressEffects(
                                    setup.state,
                                ),
                        },
                    );

                expect(intent).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .PURGE_SPAM,

                    role:
                        OFFICER_ROLE.SCIENCE,

                    channelId,
                });
            },
        );

        it(
            'cannot purge without enemy Science',
            () => {
                const setup =
                    createAnchoredPlayerCombatTestSetup();

                setup.targetActor.crewRoles =
                    [];

                setup.targetActor.crewTasks =
                    {};

                setup.targetActor.weapons =
                    [];

                delete setup.targetActor
                    .pointDefense;

                const projector =
                    getPlayerWeaponOrThrow(
                        setup.state,

                        SHIP_WEAPON_KIND
                            .SPAM_PROJECTOR,
                    );

                const channelId =
                    activatePlayerSpam(
                        setup,
                    );

                setup.engine.step(
                    SCIENCE_PURGE_SPAM_DURATION_MS *
                        2,
                );

                expect(projector).toMatchObject({
                    phase:
                        SHIP_WEAPON_PHASE
                            .CHANNELING,

                    activeChannelId:
                        channelId,
                });

                expect(
                    getPlayerSpamEffects(
                        setup,
                    ),
                ).toHaveLength(1);
            },
        );
    },
);

function getPlayerSpamEffects(
    setup:
        AnchoredPlayerCombatTestSetup,
) {
    return getActiveCrewProgressEffects(
        setup.state,
    ).filter((effect) => {
        return (
            effect.source.kind ===
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP &&
            effect.target.kind ===
                COMBAT_TARGET_KIND
                    .ACTOR &&
            effect.target.actorId ===
                setup.targetActor.id
        );
    });
}

function makeEnemyScienceOnly(
    setup:
        AnchoredPlayerCombatTestSetup,
): void {
    setup.targetActor.crewRoles = [
        OFFICER_ROLE.SCIENCE,
    ];

    setup.targetActor.crewTasks =
        {};

    setup.targetActor.weapons =
        [];

    delete setup.targetActor
        .pointDefense;
}

function activatePlayerSpam(
    setup:
        AnchoredPlayerCombatTestSetup,
): string {
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

    const started =
        setup.engine
            .drainEvents()
            .find((event) => {
                return (
                    event.type ===
                    ENCOUNTER_EVENT
                        .PLAYER_SPAM_CHANNEL_STARTED
                );
            });

    if (
        !started ||
        started.type !==
            ENCOUNTER_EVENT
                .PLAYER_SPAM_CHANNEL_STARTED
    ) {
        throw new Error(
            'Expected player spam channel start',
        );
    }

    return started.channelId;
}
