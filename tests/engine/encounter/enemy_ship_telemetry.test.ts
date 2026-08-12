// tests/engine/encounter/enemy_ship_telemetry.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
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
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_DRIVE_STATUS,
} from '../../../src/engine/defs/ship_drive';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
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
            ShipNodeActorFactory.create({
                id: 'ship_generic_00',

                presetId:
                    SHIP_NODE_ACTOR_PRESET_ID
                        .ENEMY_COMBAT_00,

                anchorId: stationId,
            });

        // This test tracks the Weapons-owned phase transition.
        // Keep Science from starting the spam projector in parallel.
        enemyShip.crewRoles =
            enemyShip.crewRoles.filter(
                (role) => {
                    return (
                        role !==
                        OFFICER_ROLE.SCIENCE
                    );
                },
            );

        delete enemyShip
            .crewTraitsByRole[
                OFFICER_ROLE.SCIENCE
            ];

        node.actors.push(enemyShip);

        const engine = new EncounterEngine({
            playerHull: createPlayerHullFixture(),

            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId: stationId,
            },

            drive:
                createShipDriveFixture(),
            random: () => 0,
        });

        engine.drainEvents();

        const [initial] =
            engine
                .getEnemyShipTelemetrySnapshots();

        expect(initial).toEqual({
            actorId: 'ship_generic_00',

            hull: {
                current: 3,
                max: 3,
            },

            drive: {
                status:
                    SHIP_DRIVE_STATUS.ONLINE,
            },

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
                    id: 'laser_00',

                    kind:
                        SHIP_WEAPON_KIND.LASER,

                    phase:
                        SHIP_WEAPON_PHASE.READY,
                },
                {
                    id:
                        'sticky_mine_dispenser_00',

                    kind:
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER,

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

        const [fresh] =
            engine
                .getEnemyShipTelemetrySnapshots();

        expect(fresh?.hull.current).toBe(3);
        expect(fresh?.weapons).toHaveLength(4);

        engine.step(0);

        expect(
            engine
                .getEnemyShipTelemetrySnapshots()[0]
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
                id: 'laser_00',
                phase:
                    SHIP_WEAPON_PHASE.READY,
            },
            {
                id:
                    'sticky_mine_dispenser_00',
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
            playerHull: createPlayerHullFixture(),

            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId: stationId,
            },

            drive:
                createShipDriveFixture(),
        });

        engine.drainEvents();

        expect(
            engine
                .getEnemyShipTelemetrySnapshots(),
        ).toEqual([]);
    });
});
