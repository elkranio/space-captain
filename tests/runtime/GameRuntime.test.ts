// tests/runtime/GameRuntime.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import {
    DEBUG_START,
} from '../../src/engine/content/catalogs/debug_start';
import {
    DEBUG_START_EQUIPMENT_TYPE,
    type DebugStartEquipmentType,
} from '../../src/engine/content/schemas/debug_start';
import {
    SHIP_CHASSIS,
} from '../../src/engine/content/catalogs/ship_chassis';
import {
    POWER_CORE_ID,
} from '../../src/engine/defs/power_core';
import {
    SHIP_DRIVE_ID,
    SHIP_DRIVE_STATUS,
} from '../../src/engine/defs/ship_drive';

function getConfiguredPlayerEquipmentId(
    type: DebugStartEquipmentType,
): string {
    const equipment =
        DEBUG_START.player.equipment.find(
            (item) => item.type === type,
        );

    if (!equipment) {
        throw new Error(
            'Missing configured player equipment: ' +
                type,
        );
    }

    return equipment.equipmentId;
}

function getConfiguredPlayerWeaponIds(): string[] {
    return DEBUG_START.player.equipment
        .filter(
            (item) =>
                item.type ===
                DEBUG_START_EQUIPMENT_TYPE.WEAPON,
        )
        .map((item) => item.equipmentId);
}

describe('GameRuntime player ship hull', () => {
    it('creates a new run from current Debug Start hardware', () => {
        const runtime =
            new GameRuntime();

        const ship =
            runtime
                .getCurrentRun()
                .player
                .ship;

        expect(ship.hull).toBe(
            SHIP_CHASSIS[
                ship.chassisId
            ].maxHull,
        );

        expect(ship.maxHull).toBe(
            SHIP_CHASSIS[
                ship.chassisId
            ].maxHull,
        );

        expect(
            ship.drive.driveId,
        ).toBe(
            getConfiguredPlayerEquipmentId(
                DEBUG_START_EQUIPMENT_TYPE.DRIVE,
            ),
        );

        expect(
            ship.powerCore.powerCoreId,
        ).toBe(
            DEBUG_START.player
                .powerCoreId,
        );

        expect(
            ship.shieldGenerator
                .shieldGeneratorId,
        ).toBe(
            getConfiguredPlayerEquipmentId(
                DEBUG_START_EQUIPMENT_TYPE
                    .SHIELD_GENERATOR,
            ),
        );

        expect(
            ship.defenseTurret
                .defenseTurretId,
        ).toBe(
            getConfiguredPlayerEquipmentId(
                DEBUG_START_EQUIPMENT_TYPE
                    .DEFENSE_TURRET,
            ),
        );

        expect(
            ship.weapons.map(
                (weapon) =>
                    weapon.weaponId,
            ),
        ).toEqual(
            getConfiguredPlayerWeaponIds(),
        );

        expect(
            new Set(
                ship.weapons.map(
                    (weapon) =>
                        weapon.id,
                ),
            ).size,
        ).toBe(
            ship.weapons.length,
        );
    });

    it('persists an exact player hull snapshot without replacing ship hardware', () => {
        const runtime =
            new GameRuntime();

        const ship =
            runtime
                .getCurrentRun()
                .player
                .ship;

        const weapons =
            ship.weapons;

        runtime.setPlayerShipHull(
            2,
        );

        expect(ship.hull).toBe(2);

        runtime.setPlayerShipHull(
            0,
        );

        expect(ship.hull).toBe(0);
        expect(ship.weapons).toBe(
            weapons,
        );
    });

    it('rejects a player hull snapshot outside its installed maximum', () => {
        const runtime =
            new GameRuntime();

        const maxHull =
            runtime
                .getCurrentRun()
                .player
                .ship
                .maxHull;

        expect(() => {
            runtime.setPlayerShipHull(
                -1,
            );
        }).toThrow(
            'Player ship hull must be in [0, maxHull]: -1/' +
                maxHull,
        );

        const aboveMax =
            maxHull + 1;

        expect(() => {
            runtime.setPlayerShipHull(
                aboveMax,
            );
        }).toThrow(
            'Player ship hull must be in [0, maxHull]: ' +
                aboveMax +
                '/' +
                maxHull,
        );
    });
});

describe('GameRuntime player drive', () => {
    it('updates persistent drive status without replacing the installed drive', () => {
        const runtime = new GameRuntime();

        runtime.setPlayerShipDriveState({
            id: 'drive_player_00',

            driveId:
                SHIP_DRIVE_ID.BASIC_00,

            status:
                SHIP_DRIVE_STATUS.DISABLED,
        });

        expect(
            runtime.getCurrentRun().player.ship.drive,
        ).toEqual({
            id: 'drive_player_00',

            driveId:
                SHIP_DRIVE_ID.BASIC_00,

            status:
                SHIP_DRIVE_STATUS.DISABLED,
        });
    });
});

describe('GameRuntime player power core', () => {
    it('updates persistent defense-powerCore runtime state', () => {
        const runtime =
            new GameRuntime();

        runtime
            .setPlayerShipPowerCoreState({
                id:
                    'power_core_player_00',

                powerCoreId:
                    POWER_CORE_ID
                        .BASIC_00,

                charges: 2,
                rechargeElapsedMs: 7500,
            });

        expect(
            runtime
                .getCurrentRun()
                .player
                .ship
                .powerCore,
        ).toEqual({
            id:
                'power_core_player_00',

            powerCoreId:
                POWER_CORE_ID
                    .BASIC_00,

            charges: 2,
            rechargeElapsedMs: 7500,
        });
    });

    it('rejects invalid defense-powerCore runtime state', () => {
        const runtime =
            new GameRuntime();

        expect(() => {
            runtime
                .setPlayerShipPowerCoreState({
                    id:
                        'power_core_player_00',

                    powerCoreId:
                        POWER_CORE_ID
                            .BASIC_00,

                    charges: 5,
                    rechargeElapsedMs: 0,
                });
        }).toThrow(
            'Player defense-powerCore charges must be an integer between 0 and 4: 5',
        );

        expect(() => {
            runtime
                .setPlayerShipPowerCoreState({
                    id:
                        'power_core_player_00',

                    powerCoreId:
                        POWER_CORE_ID
                            .BASIC_00,

                    charges: 3,
                    rechargeElapsedMs: 24000,
                });
        }).toThrow(
            'Player defense-powerCore recharge elapsed must be in [0, 24000): 24000',
        );

        expect(() => {
            runtime
                .setPlayerShipPowerCoreState({
                    id:
                        'power_core_player_00',

                    powerCoreId:
                        POWER_CORE_ID
                            .BASIC_00,

                    charges: 4,
                    rechargeElapsedMs: 1,
                });
        }).toThrow(
            'Full player power core must have zero recharge elapsed: 1',
        );
    });
});
