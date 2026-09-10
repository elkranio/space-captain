// tests/engine/encounter/enemy_ship_telemetry.test.ts

import { createFullCombatEnemyActorFixture } from '../../fixtures/engine/full_combat_enemy_fixtures';
import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createPlayerShipFixture } from '../../fixtures/engine/player_ship_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_DRIVES,
} from '../../../src/engine/content/catalogs/ship_drives';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_EVADE_PHASE,
} from '../../../src/engine/defs/ship_evade';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe('Enemy ship telemetry', () => {
    it('returns a detached snapshot and tracks runtime weapon phases', () => {
        const {
            node,
            stationId,
        } = createSingleStationNodeFixture();

        const enemyShip =
            createFullCombatEnemyActorFixture(
                stationId,
                'ship_generic_00',
            );

        // This test tracks the Gunner-owned phase transition.
        // Keep Scientist from starting the spam projector in parallel.
        enemyShip.crewRoles =
            enemyShip.crewRoles.filter(
                (role) => {
                    return (
                        role !==
                        OFFICER_ROLE.SCIENTIST
                    );
                },
            );

        node.actors.push(enemyShip);

        const engine = new EncounterEngine({
            playerShip: createPlayerShipFixture({
                playerHull: createPlayerHullFixture(),
                drive: createShipDriveFixture(),
            }),

            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId: stationId,
            },

            random: () => 0,
        });

        engine.drainEvents();

        const [initial] =
            engine
                .getCombatPresentationSnapshot()
                .enemyShips;

        expect(initial).toEqual({
            actorId: 'ship_generic_00',

            hull: {
                current: 3,
                max: 3,
            },

            drive: {
                integrity:
                    SHIP_DRIVES[
                        enemyShip.drive
                            .driveId
                    ].maxIntegrity,
            },

            evade: {
                phase:
                    SHIP_EVADE_PHASE.READY,

                phaseElapsedMs: 0,
                cooldownRemainingMs: 0,
            },

            evadeDurationMs:
                SHIP_DRIVES[
                    enemyShip.drive
                        .driveId
                ]
                    .evadeDurationMs,

            weapons: [
                {
                    id:
                        'missile_launcher_00',

                    kind:
                        SHIP_WEAPON_KIND
                            .MISSILE_LAUNCHER,

                    phase:
                        SHIP_WEAPON_PHASE.READY,
                },
                {
                    id: 'beam_cannon_00',

                    kind:
                        SHIP_WEAPON_KIND.BEAM_CANNON,

                    phase:
                        SHIP_WEAPON_PHASE.READY,
                },
                {
                    id: 'spam_projector_00',

                    kind:
                        SHIP_WEAPON_KIND
                            .SPAM_PROJECTOR,

                    phase:
                        SHIP_WEAPON_PHASE.READY,
                },
            ],
        });

        if (!initial) {
            throw new Error(
                'Expected enemy telemetry',
            );
        }

        initial.hull.current = 0;
        initial.weapons.length = 0;

        initial.evade.phase =
            SHIP_EVADE_PHASE.COOLDOWN;

        initial.evade.phaseElapsedMs =
            123;

        initial.evade.cooldownRemainingMs =
            456;

        const [fresh] =
            engine
                .getCombatPresentationSnapshot()
                .enemyShips;

        expect(fresh?.hull.current).toBe(3);
        expect(fresh?.weapons).toHaveLength(3);

        expect(
            fresh?.evade,
        ).toEqual({
            phase:
                SHIP_EVADE_PHASE.READY,

            phaseElapsedMs: 0,
            cooldownRemainingMs: 0,
        });

        engine.step(0);

        expect(
            engine
                .getCombatPresentationSnapshot()
                .enemyShips[0]
                ?.weapons
                .map((weapon) => {
                    return {
                        id: weapon.id,
                        phase: weapon.phase,
                    };
                }),
        ).toEqual([
            {
                id: 'missile_launcher_00',
                phase:
                    SHIP_WEAPON_PHASE.TARGETING,
            },
            {
                id: 'beam_cannon_00',
                phase:
                    SHIP_WEAPON_PHASE.READY,
            },
            {
                id: 'spam_projector_00',
                phase:
                    SHIP_WEAPON_PHASE.READY,
            },
        ]);
    });

    it('returns no telemetry when the current anchor has no enemy ship', () => {
        const {
            node,
            stationId,
        } = createSingleStationNodeFixture();

        const engine = new EncounterEngine({
            random: () => 0.5,
            playerShip: createPlayerShipFixture({
                playerHull: createPlayerHullFixture(),
                drive: createShipDriveFixture(),
            }),

            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId: stationId,
            },
        });

        engine.drainEvents();

        expect(
            engine
                .getCombatPresentationSnapshot()
                .enemyShips,
        ).toEqual([]);
    });
});
