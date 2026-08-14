import {
    MISSILE_SIGNATURE,
} from '../../../src/engine/defs/missile';
// tests/engine/encounter/player_missile_lifecycle.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    createNewRunState,
} from '../../../src/engine/content/new_game/create_new_run_state';
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
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type MissileLauncherState,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';
import {
    createCanonicalPlayerCombatWeapons,
} from './combat_test_support';

describe('Player missile lifecycle', () => {
    it('launches after aiming, spends one missile and releases Weapons', () => {
        const {
            engine,
            launcher,
            targetActorId,
        } = createMissileLifecycleSetup();

        const launcherDefinition =
            SHIP_WEAPONS[
                launcher.weaponId
            ];

        if (
            launcherDefinition.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER
        ) {
            throw new Error(
                'Expected missile launcher definition',
            );
        }

        const ammoBefore =
            launcher.ammoCount;

        executeFireMissile(
            engine,
            targetActorId,
        );

        engine.drainEvents();

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS -
                1,
        );

        expect(launcher).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.TARGETING,

            phaseElapsedMs:
                SHIP_WEAPON_TARGETING_DURATION_MS -
                1,

            ammoCount:
                ammoBefore,
        });

        expect(
            engine.getCombatProjectiles(),
        ).toEqual([]);

        expect(
            engine.getOfficerTasks(),
        ).toHaveLength(1);

        engine.step(1);

        expect(launcher).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.COOLDOWN,

            phaseElapsedMs: 0,

            ammoCount:
                ammoBefore - 1,
        });

        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);

        expect(
            engine.getCombatProjectiles(),
        ).toEqual([
            {
                id: 'projectile_1',
                designation: 'M1',

                kind:
                    COMBAT_PROJECTILE_KIND
                        .MISSILE,

                source: {
                    kind:
                        COMBAT_SOURCE_KIND
                            .PLAYER_SHIP,
                },

                sourceWeaponId:
                    launcher.id,

                target: {
                    kind:
                        COMBAT_TARGET_KIND.ACTOR,

                    actorId:
                        targetActorId,
                },

                signature:
                MISSILE_SIGNATURE.A,

            identification: {
                    status:
                        MISSILE_SIGNATURE_INTEL_STATUS
                            .CONFIRMED,

                    hypothesis:
                        'signature_a',
                },

                damage:
                    launcherDefinition.damage,

                timeToImpactMs:
                    launcherDefinition.flightDurationMs,

                initialTimeToImpactMs:
                    launcherDefinition.flightDurationMs,
            },
        ]);

        const launchEvents =
            engine.drainEvents();

        expect(launchEvents).toContainEqual(
            expect.objectContaining({
                type:
                    ENCOUNTER_EVENT
                        .OFFICER_TASK_ENDED,

                outcome:
                    OFFICER_TASK_OUTCOME
                        .COMPLETED,
            }),
        );

        expect(
            launchEvents.some((event) => {
                return (
                    event.type ===
                    ENCOUNTER_EVENT
                        .MISSILE_LAUNCHED
                );
            }),
        ).toBe(false);

        const availableCommands =
            engine.getAvailableCommands(
                OFFICER_ROLE.WEAPONS,
            );

        expect(
            availableCommands.some(
                (command) => {
                    return (
                        command.commandId ===
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_MISSILE
                    );
                },
            ),
        ).toBe(false);

        expect(
            availableCommands.filter(
                (command) => {
                    return (
                        command.commandId ===
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_BEAM_CANNON
                    );
                },
            ),
        ).toHaveLength(1);

        engine.step(1000);

        expect(launcher).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.COOLDOWN,

            phaseElapsedMs: 1000,
        });

        expect(
            engine.getCombatProjectiles()[0]
                ?.timeToImpactMs,
        ).toBe(
            launcherDefinition.flightDurationMs -
                1000,
        );
    });

    it('does not double-launch on a large step and returns empty launcher to READY after cooldown', () => {
        const {
            engine,
            launcher,
            targetActorId,
        } = createMissileLifecycleSetup(1);

        executeFireMissile(
            engine,
            targetActorId,
        );

        engine.drainEvents();

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS +
                100000,
        );

        expect(launcher).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.COOLDOWN,

            phaseElapsedMs: 0,

            ammoCount: 0,
        });

        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);

        expect(
            engine.getCombatProjectiles(),
        ).toHaveLength(1);

        engine.step(0);

        expect(
            engine.getCombatProjectiles(),
        ).toHaveLength(1);

        expect(
            launcher.ammoCount,
        ).toBe(0);

        const launcherDefinition =
            SHIP_WEAPONS[
                launcher.weaponId
            ];

        if (
            launcherDefinition.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER
        ) {
            throw new Error(
                'Expected missile launcher definition',
            );
        }

        engine.step(
            launcherDefinition
                .cooldownDurationMs -
                1,
        );

        expect(launcher).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.COOLDOWN,

            phaseElapsedMs:
                launcherDefinition
                    .cooldownDurationMs -
                1,

            ammoCount: 0,
        });

        engine.step(1);

        expect(launcher).toMatchObject({
            phase:
                SHIP_WEAPON_PHASE.READY,

            phaseElapsedMs: 0,

            ammoCount: 0,
        });

        expect(
            engine.getCombatProjectiles(),
        ).toEqual([]);

        expect(
            engine
                .getAvailableCommands(
                    OFFICER_ROLE.WEAPONS,
                )
                .some((command) => {
                    return (
                        command.commandId ===
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_MISSILE
                    );
                }),
        ).toBe(false);
    });
});

function createMissileLifecycleSetup(
    ammoCount?: number,
): {
    engine: EncounterEngine;

    launcher:
        MissileLauncherState;

    targetActorId: string;
} {
    const run =
        createNewRunState();

    const startNode =
        run.universe.nodes.find(
            (node) => {
                return (
                    node.id ===
                    'node_start'
                );
            },
        );

    if (!startNode) {
        throw new Error(
            'Expected new-game start node',
        );
    }

    const enemy =
        startNode.actors.find(
            (actor) => {
                return (
                    actor.team ===
                    ENCOUNTER_TEAM.ENEMY
                );
            },
        );

    if (!enemy) {
        throw new Error(
            'Expected enemy target actor',
        );
    }

    // Изолируем player lifecycle
    // от enemy scheduler.
    enemy.crewRoles = [];
    enemy.weapons = [];

    const playerWeapons =
        createCanonicalPlayerCombatWeapons();

    const installedLauncher =
        playerWeapons.find(
            (weapon) => {
                return (
                    weapon.kind ===
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER
                );
            },
        );

    if (
        !installedLauncher ||
        installedLauncher.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER
    ) {
        throw new Error(
            'Expected installed player missile launcher',
        );
    }

    if (ammoCount !== undefined) {
        installedLauncher.ammoCount =
            ammoCount;
    }

    const engine = new EncounterEngine({
        playerHull: createPlayerHullFixture(),

        node: startNode,

        navigation: {
            kind:
                PLAYER_SPACE_NAVIGATION_KIND
                    .ANCHORED,

            anchorId:
                startNode.arrivalAnchorId,
        },

        drive:
            run.player.ship.drive,
        weapons:
            playerWeapons,

        random: () => 0,
    });

    const [loadedEvent] =
        engine.drainEvents();

    if (
        loadedEvent.type !==
        ENCOUNTER_EVENT.ENCOUNTER_LOADED
    ) {
        throw new Error(
            'Expected encounter loaded event',
        );
    }

    const launcher =
        getMutableEncounterStateForTest(engine)
            .combat
            .playerWeapons
            .find((weapon) => {
                return (
                    weapon.kind ===
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER
                );
            });

    if (
        !launcher ||
        launcher.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER
    ) {
        throw new Error(
            'Expected encounter player missile launcher',
        );
    }

    return {
        engine,
        launcher,
        targetActorId:
            enemy.id,
    };
}

function executeFireMissile(
    engine: EncounterEngine,
    targetActorId: string,
): void {
    const command =
        engine
            .getAvailableCommands(
                OFFICER_ROLE.WEAPONS,
            )
            .find((candidate) => {
                return (
                    candidate.commandId ===
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_MISSILE &&
                    candidate.target.kind ===
                        OFFICER_COMMAND_TARGET_KIND
                            .ACTOR_WEAPON &&
                    candidate.target.actorId ===
                        targetActorId
                );
            });

    if (!command) {
        throw new Error(
            'Expected FIRE MISSILE command',
        );
    }

    engine.executeCommand({
        role:
            OFFICER_ROLE.WEAPONS,

        commandId:
            command.commandId,

        target:
            command.target,
    });
}
