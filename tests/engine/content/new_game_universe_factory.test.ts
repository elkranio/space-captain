// tests/engine/content/new_game_universe_factory.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    DEBUG_START,
} from '../../../src/engine/content/catalogs/debug_start';
import {
    DEBUG_START_EQUIPMENT_TYPE,
    type DebugStartEquipmentType,
} from '../../../src/engine/content/schemas/debug_start';
import NewGameUniverseFactory from '../../../src/engine/generation/new_game/NewGameUniverseFactory';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SPACE_BACKGROUND_ID,
} from '../../../src/engine/defs/space_background';
import {
    SHIP_DRIVE_STATUS,
} from '../../../src/engine/defs/ship_drive';
import {
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import {
    SPACE_ANCHOR_KIND,
    SPACE_NODE_ACTOR_KIND,
} from '../../../src/engine/defs/universe';

function getConfiguredEnemyEquipmentId(
    type: DebugStartEquipmentType,
): string | null {
    return (
        DEBUG_START.enemy
            .equipment
            .find((equipment) => {
                return equipment.type === type;
            })
            ?.equipmentId ??
        null
    );
}

function getConfiguredEnemyWeaponIds(): string[] {
    return DEBUG_START.enemy
        .equipment
        .filter((equipment) => {
            return (
                equipment.type ===
                DEBUG_START_EQUIPMENT_TYPE
                    .WEAPON
            );
        })
        .map((equipment) => {
            return equipment.equipmentId;
        });
}

describe('NewGameUniverseFactory', () => {
    it('creates a connected universe with configured debug enemy hardware', () => {
        const generated =
            NewGameUniverseFactory.create();

        expect(
            generated.universe.nodes,
        ).toHaveLength(2);

        const [
            startNode,
            stationNode,
        ] =
            generated.universe.nodes;

        expect(startNode.id).toBe(
            'node_start',
        );

        expect(startNode.position).toEqual({
            x: 0,
            y: 0,
        });

        expect(
            startNode.spaceBackgroundId,
        ).toBe(
            SPACE_BACKGROUND_ID.NEBULA_00,
        );

        expect(stationNode.id).toBe(
            'node_station',
        );

        expect(
            stationNode.position,
        ).toEqual({
            x: 100,
            y: 0,
        });

        expect(
            stationNode.spaceBackgroundId,
        ).toBe(
            SPACE_BACKGROUND_ID.NEBULA_00,
        );

        const navigationBeaconAnchor =
            startNode.anchors.find(
                (anchor) => {
                    return (
                        anchor.kind ===
                        SPACE_ANCHOR_KIND
                            .NAVIGATION_BEACON
                    );
                },
            );

        if (
            !navigationBeaconAnchor ||
            navigationBeaconAnchor.kind !==
                SPACE_ANCHOR_KIND
                    .NAVIGATION_BEACON
        ) {
            throw new Error(
                'Expected start navigation beacon anchor',
            );
        }

        expect(
            navigationBeaconAnchor.localPosition,
        ).toEqual({
            x: 0,
            y: 0,
            z: 0,
        });

        expect(
            startNode.arrivalAnchorId,
        ).toBe(
            navigationBeaconAnchor
                .beacon.id,
        );

        const asteroidAnchor =
            startNode.anchors.find(
                (anchor) => {
                    return (
                        anchor.kind ===
                        SPACE_ANCHOR_KIND.ASTEROID
                    );
                },
            );

        if (
            !asteroidAnchor ||
            asteroidAnchor.kind !==
                SPACE_ANCHOR_KIND.ASTEROID
        ) {
            throw new Error(
                'Expected start asteroid anchor',
            );
        }

        expect(
            asteroidAnchor.localPosition,
        ).toEqual({
            x: 900,
            y: 220,
            z: 1400,
        });

        const startStationAnchor =
            startNode.anchors.find(
                (anchor) => {
                    return (
                        anchor.kind ===
                        SPACE_ANCHOR_KIND.STATION
                    );
                },
            );

        if (
            !startStationAnchor ||
            startStationAnchor.kind !==
                SPACE_ANCHOR_KIND.STATION
        ) {
            throw new Error(
                'Expected start station anchor',
            );
        }

        expect(
            startStationAnchor.localPosition,
        ).toEqual({
            x: -900,
            y: 220,
            z: -1400,
        });

        const stationNodeAnchor =
            stationNode.anchors.find(
                (anchor) => {
                    return (
                        anchor.kind ===
                        SPACE_ANCHOR_KIND.STATION
                    );
                },
            );

        if (
            !stationNodeAnchor ||
            stationNodeAnchor.kind !==
                SPACE_ANCHOR_KIND.STATION
        ) {
            throw new Error(
                'Expected station node anchor',
            );
        }

        expect(
            stationNodeAnchor.localPosition,
        ).toEqual({
            x: 0,
            y: 0,
            z: 0,
        });

        expect(
            startStationAnchor.station,
        ).toBe(
            stationNodeAnchor.station,
        );

        expect(
            stationNode.arrivalAnchorId,
        ).toBe(
            stationNodeAnchor.station.id,
        );

        expect(
            startNode.actors,
        ).toHaveLength(1);

        const [enemy] =
            startNode.actors;

        expect(enemy.id).toBe(
            'ship_generic_00',
        );

        expect(enemy.kind).toBe(
            SPACE_NODE_ACTOR_KIND.SHIP,
        );

        expect(enemy.anchorId).toBe(
            navigationBeaconAnchor
                .beacon.id,
        );

        expect(enemy.chassisId).toBe(
            DEBUG_START.enemy.chassisId,
        );

        expect(enemy.drive.driveId).toBe(
            getConfiguredEnemyEquipmentId(
                DEBUG_START_EQUIPMENT_TYPE
                    .DRIVE,
            ),
        );

        expect(
            enemy.defenseTurret
                ?.defenseTurretId ??
                null,
        ).toBe(
            getConfiguredEnemyEquipmentId(
                DEBUG_START_EQUIPMENT_TYPE
                    .DEFENSE_TURRET,
            ),
        );

        expect(
            enemy.powerCore
                ?.powerCoreId ??
                null,
        ).toBe(
            DEBUG_START.enemy
                .powerCoreId,
        );

        expect(
            enemy.shieldGenerator
                ?.shieldGeneratorId ??
                null,
        ).toBe(
            getConfiguredEnemyEquipmentId(
                DEBUG_START_EQUIPMENT_TYPE
                    .SHIELD_GENERATOR,
            ),
        );

        expect(
            enemy.weapons.map(
                (weapon) =>
                    weapon.weaponId,
            ),
        ).toEqual(
            getConfiguredEnemyWeaponIds(),
        );

        expect(enemy.crewRoles).toEqual([
            OFFICER_ROLE.SCIENTIST,
            OFFICER_ROLE.PILOT,
            OFFICER_ROLE.GUNNER,
            OFFICER_ROLE.ENGINEER,
        ]);

        expect(
            generated.playerLocations
                .arrivingAtStart,
        ).toEqual({
            kind:
                PLAYER_LOCATION_KIND.SPACE,

            nodeId: startNode.id,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ARRIVING,

                targetAnchorId:
                    navigationBeaconAnchor
                        .beacon.id,
            },
        });

        expect(
            generated.playerLocations
                .travellingToStart,
        ).toEqual({
            kind:
                PLAYER_LOCATION_KIND.SPACE,

            nodeId: startNode.id,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .TRAVELLING,

                fromAnchorId:
                    asteroidAnchor
                        .asteroid.id,

                targetAnchorId:
                    navigationBeaconAnchor
                        .beacon.id,
            },
        });

        expect(
            generated.playerLocations
                .arrivingAtStation,
        ).toEqual({
            kind:
                PLAYER_LOCATION_KIND.SPACE,

            nodeId: stationNode.id,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ARRIVING,

                targetAnchorId:
                    stationNodeAnchor
                        .station.id,
            },
        });
    });

    it('creates fresh mutable enemy hardware on each call', () => {
        const first =
            NewGameUniverseFactory.create();

        const second =
            NewGameUniverseFactory.create();

        const firstEnemy =
            first.universe.nodes[0]
                .actors[0];

        const secondEnemy =
            second.universe.nodes[0]
                .actors[0];

        expect(firstEnemy).not.toBe(
            secondEnemy,
        );

        expect(
            firstEnemy.drive,
        ).not.toBe(
            secondEnemy.drive,
        );

        expect(
            firstEnemy.weapons,
        ).not.toBe(
            secondEnemy.weapons,
        );

        expect(
            firstEnemy.weapons,
        ).toHaveLength(
            getConfiguredEnemyWeaponIds()
                .length,
        );

        expect(
            secondEnemy.weapons,
        ).toHaveLength(
            getConfiguredEnemyWeaponIds()
                .length,
        );

        for (
            let index = 0;
            index <
            firstEnemy.weapons.length;
            index += 1
        ) {
            expect(
                firstEnemy.weapons[index],
            ).not.toBe(
                secondEnemy.weapons[index],
            );
        }

        if (
            firstEnemy.shieldGenerator &&
            secondEnemy.shieldGenerator
        ) {
            expect(
                firstEnemy.shieldGenerator,
            ).not.toBe(
                secondEnemy.shieldGenerator,
            );
        }

        firstEnemy.drive.status =
            SHIP_DRIVE_STATUS.DISABLED;

        expect(
            secondEnemy.drive.status,
        ).toBe(
            SHIP_DRIVE_STATUS.ONLINE,
        );

        const firstWeapon =
            firstEnemy.weapons[0];

        const secondWeapon =
            secondEnemy.weapons[0];

        if (
            firstWeapon &&
            secondWeapon
        ) {
            firstWeapon.phase =
                SHIP_WEAPON_PHASE.COOLDOWN;

            expect(
                secondWeapon.phase,
            ).toBe(
                SHIP_WEAPON_PHASE.READY,
            );
        }

        expect(
            first.playerLocations
                .arrivingAtStart,
        ).not.toBe(
            second.playerLocations
                .arrivingAtStart,
        );
    });
});
