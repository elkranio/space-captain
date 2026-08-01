// tests/engine/encounter/enemy_ship_telemetry.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import NewGameUniverseFactory from '../../../src/engine/content/new_game/NewGameUniverseFactory';
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
import {
    createPointDefenseFixture,
} from '../../fixtures/engine/point_defense_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';

describe('Enemy ship telemetry', () => {
    it('returns a detached snapshot and tracks runtime weapon phases', () => {
        const generation =
            NewGameUniverseFactory.create();

        const startNode =
            generation.universe.nodes.find(
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

        const engine = new EncounterEngine({
            node: startNode,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    startNode.arrivalAnchorId,
            },

            drive:
                createShipDriveFixture(),

            pointDefense:
                createPointDefenseFixture(),

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

            shieldGenerator: {
                current: 3,
                max: 3,
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
        const generation =
            NewGameUniverseFactory.create();

        const stationNode =
            generation.universe.nodes.find(
                (node) => {
                    return (
                        node.id ===
                        'node_station'
                    );
                },
            );

        if (!stationNode) {
            throw new Error(
                'Expected new-game station node',
            );
        }

        const engine = new EncounterEngine({
            node: stationNode,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    stationNode.arrivalAnchorId,
            },

            drive:
                createShipDriveFixture(),

            pointDefense:
                createPointDefenseFixture(),
        });

        engine.drainEvents();

        expect(
            engine
                .getEnemyShipTelemetrySnapshots(),
        ).toEqual([]);
    });
});
