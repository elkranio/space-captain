import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    DEBUG_START,
} from '../../../src/engine/content/catalogs/debug_start';
import {
    SHIP_CHASSIS,
} from '../../../src/engine/content/catalogs/ship_chassis';
import {
    SHIP_CHASSIS_ID,
} from '../../../src/engine/defs/ship_chassis';
import {
    SHIP_WEAPON_KIND,
} from '../../../src/engine/defs/ship_weapon';
import {
    createDebugStartEnemyShip,
    createDebugStartPlayerShip,
} from '../../../src/engine/generation/new_game/debug_start_ship_factory';

describe(
    'Debug Start ship factory',
    () => {
        it(
            'creates the player through the configured chassis and shared ShipFactory path',
            () => {
                const ship =
                    createDebugStartPlayerShip();

                expect(ship.chassisId).toBe(
                    SHIP_CHASSIS_ID.PLAYER_00,
                );

                const expectedHull =
                    SHIP_CHASSIS[DEBUG_START.player.chassisId].maxHull;

                expect(ship.hull).toBe(expectedHull);
                expect(ship.maxHull).toBe(expectedHull);

                expect(
                    ship.mounts
                        .map(
                            (mount) => mount.slotId,
                        )
                        .sort(),
                ).toEqual(
                    DEBUG_START.player.equipment
                        .map(
                            (equipment) =>
                                equipment.slotId,
                        )
                        .sort(),
                );

                expect(
                    ship.weapons.map(
                        (weapon) => {
                            return {
                                id: weapon.id,
                                kind: weapon.kind,
                                weaponId: weapon.weaponId,
                            };
                        },
                    ),
                ).toEqual([
                    {
                        id:
                            'spam_projector_player_00',
                        kind:
                            SHIP_WEAPON_KIND
                                .SPAM_PROJECTOR,
                        weaponId:
                            'spam_projector_00',
                    },
                    {
                        id:
                            'sticky_mine_dispenser_player_00',
                        kind:
                            SHIP_WEAPON_KIND
                                .STICKY_MINE_DISPENSER,
                        weaponId:
                            'sticky_mine_solo',
                    },
                    {
                        id:
                            'beam_cannon_player_00',
                        kind:
                            SHIP_WEAPON_KIND
                                .BEAM_CANNON,
                        weaponId:
                            'fast_beam',
                    },
                    {
                        id:
                            'missile_launcher_player_00',
                        kind:
                            SHIP_WEAPON_KIND
                                .MISSILE_LAUNCHER,
                        weaponId:
                            'missile_launcher_00',
                    },
                ]);
            },
        );

        it(
            'keeps the enemy on its configured chassis',
            () => {
                const ship =
                    createDebugStartEnemyShip();

                expect(ship.chassisId).toBe(
                    SHIP_CHASSIS_ID.GENERIC_00,
                );

                const expectedHull =
                    SHIP_CHASSIS[DEBUG_START.enemy.chassisId].maxHull;

                expect(ship.hull).toBe(expectedHull);
                expect(ship.maxHull).toBe(expectedHull);
            },
        );
    },
);
