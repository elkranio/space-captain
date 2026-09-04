// tests/runtime/GameRuntime.test.ts

import { describe, expect, it } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import { POWER_CORES } from '../../src/engine/content/catalogs/power_cores';
import { DEBUG_START } from '../../src/engine/content/catalogs/debug_start';
import { DEBUG_START_EQUIPMENT_TYPE, type DebugStartEquipmentType } from '../../src/engine/content/schemas/debug_start';
import { SHIP_CHASSIS } from '../../src/engine/content/catalogs/ship_chassis';
import { SHIP_DRIVE_STATUS } from '../../src/engine/defs/ship_drive';

function getConfiguredPlayerEquipmentId(type: DebugStartEquipmentType): string {
    const equipment = DEBUG_START.player.equipment.find((item) => item.type === type);

    if (!equipment) {
        throw new Error('Missing configured player equipment: ' + type);
    }

    return equipment.equipmentId;
}

function getConfiguredPlayerWeaponIds(): string[] {
    return DEBUG_START.player.equipment
        .filter((item) => item.type === DEBUG_START_EQUIPMENT_TYPE.WEAPON)
        .map((item) => item.equipmentId);
}

describe('GameRuntime player ship hull', () => {
    it('creates a new run from current Debug Start hardware', () => {
        const runtime = new GameRuntime();

        const ship = runtime.getCurrentRun().player.ship;

        expect(ship.hull).toBe(SHIP_CHASSIS[ship.chassisId].maxHull);

        expect(ship.maxHull).toBe(SHIP_CHASSIS[ship.chassisId].maxHull);

        expect(ship.drive.driveId).toBe(getConfiguredPlayerEquipmentId(DEBUG_START_EQUIPMENT_TYPE.DRIVE));

        expect(ship.powerCore.powerCoreId).toBe(DEBUG_START.player.powerCoreId);

        expect(ship.shieldGenerator.shieldGeneratorId).toBe(
            getConfiguredPlayerEquipmentId(DEBUG_START_EQUIPMENT_TYPE.SHIELD_GENERATOR),
        );

        expect(ship.defenseTurret.defenseTurretId).toBe(
            getConfiguredPlayerEquipmentId(DEBUG_START_EQUIPMENT_TYPE.DEFENSE_TURRET),
        );

        expect(ship.weapons.map((weapon) => weapon.weaponId)).toEqual(getConfiguredPlayerWeaponIds());

        expect(new Set(ship.weapons.map((weapon) => weapon.id)).size).toBe(ship.weapons.length);
    });

    it('persists an exact player hull snapshot without replacing ship hardware', () => {
        const runtime = new GameRuntime();

        const ship = runtime.getCurrentRun().player.ship;

        const weapons = ship.weapons;

        const damagedHull = Math.max(0, ship.maxHull - 1);
        runtime.setPlayerShipHull(damagedHull);
        expect(ship.hull).toBe(damagedHull);

        runtime.setPlayerShipHull(0);

        expect(ship.hull).toBe(0);
        expect(ship.weapons).toBe(weapons);
    });

    it('rejects a player hull snapshot outside its installed maximum', () => {
        const runtime = new GameRuntime();

        const maxHull = runtime.getCurrentRun().player.ship.maxHull;

        expect(() => {
            runtime.setPlayerShipHull(-1);
        }).toThrow('Player ship hull must be in [0, maxHull]: -1/' + maxHull);

        const aboveMax = maxHull + 1;

        expect(() => {
            runtime.setPlayerShipHull(aboveMax);
        }).toThrow('Player ship hull must be in [0, maxHull]: ' + aboveMax + '/' + maxHull);
    });
});

describe('GameRuntime player drive', () => {
    it('updates persistent drive status without replacing the installed drive', () => {
        const runtime = new GameRuntime();
        const installed = runtime.getCurrentRun().player.ship.drive;
        const disabled = { ...installed, status: SHIP_DRIVE_STATUS.DISABLED };
        runtime.setPlayerShipDriveState(disabled);
        expect(runtime.getCurrentRun().player.ship.drive).toEqual(disabled);
    });
});

describe('GameRuntime player power core', () => {
    it('updates persistent defense-powerCore runtime state', () => {
        const runtime = new GameRuntime();
        const installed = runtime.getCurrentRun().player.ship.powerCore;
        const definition = POWER_CORES[installed.powerCoreId];
        const charges =
            definition.rechargeDurationMs === 0 ? definition.capacity : Math.max(0, definition.capacity - 1);
        const rechargeElapsedMs =
            definition.rechargeDurationMs === 0 ? 0 : Math.floor(definition.rechargeDurationMs / 2);

        runtime.setPlayerShipPowerCoreState({
            ...installed,

            charges,
            rechargeElapsedMs,
        });

        expect(runtime.getCurrentRun().player.ship.powerCore).toEqual({
            ...installed,

            charges,
            rechargeElapsedMs,
        });
    });

    it('rejects invalid defense-powerCore runtime state', () => {
        const runtime = new GameRuntime();
        const installed = runtime.getCurrentRun().player.ship.powerCore;
        const definition = POWER_CORES[installed.powerCoreId];
        const invalidCharges = definition.capacity + 1;
        const invalidRechargeElapsedMs = definition.rechargeDurationMs === 0 ? 1 : definition.rechargeDurationMs;

        expect(() => {
            runtime.setPlayerShipPowerCoreState({
                ...installed,

                charges: invalidCharges,
                rechargeElapsedMs: 0,
            });
        }).toThrow(
            'Player defense-powerCore charges must be an integer between 0 and ' +
                definition.capacity +
                ': ' +
                invalidCharges,
        );

        expect(() => {
            runtime.setPlayerShipPowerCoreState({
                ...installed,

                charges: 0,
                rechargeElapsedMs: invalidRechargeElapsedMs,
            });
        }).toThrow(
            'Player defense-powerCore recharge elapsed must be in [0, ' +
                definition.rechargeDurationMs +
                '): ' +
                invalidRechargeElapsedMs,
        );

        const partialRecharge = definition.rechargeDurationMs / 2;
        expect(() => {
            runtime.setPlayerShipPowerCoreState({
                ...installed,

                charges: definition.capacity,
                rechargeElapsedMs: partialRecharge,
            });
        }).toThrow('Full player power core must have zero recharge elapsed: ' + partialRecharge);
    });
});
