// tests/engine/content/create_new_run_state.test.ts

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
import {
    SHIP_CHASSIS,
} from '../../../src/engine/content/catalogs/ship_chassis';
import {
    createNewRunState,
} from '../../../src/engine/generation/new_game/create_new_run_state';
import {
    DEFENSE_TURRET_PHASE,
} from '../../../src/engine/defs/defense_turret';
import {
    SHIP_DRIVE_STATUS,
} from '../../../src/engine/defs/ship_drive';
import {
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import {
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../../src/engine/defs/shield_generator';

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

describe('createNewRunState', () => {
    it('creates the configured debug-start player ship', () => {
        const run =
            createNewRunState();

        const ship =
            run.player.ship;

        expect(ship.chassisId).toBe(
            DEBUG_START.player.chassisId,
        );

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

        expect(ship.drive.driveId).toBe(
            getConfiguredPlayerEquipmentId(
                DEBUG_START_EQUIPMENT_TYPE.DRIVE,
            ),
        );

        expect(ship.drive.status).toBe(
            SHIP_DRIVE_STATUS.ONLINE,
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
            ship.defenseTurret.phase,
        ).toBe(
            DEFENSE_TURRET_PHASE.READY,
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
            ship.shieldGenerator.status,
        ).toBe(
            SHIELD_GENERATOR_STATUS.ONLINE,
        );

        expect(
            ship.shieldGenerator.phase,
        ).toBe(
            SHIELD_GENERATOR_PHASE.READY,
        );

        expect(
            ship.weapons.map(
                (weapon) =>
                    weapon.weaponId,
            ),
        ).toEqual(
            getConfiguredPlayerWeaponIds(),
        );

        for (const weapon of ship.weapons) {
            expect(weapon.phase).toBe(
                SHIP_WEAPON_PHASE.READY,
            );

            expect(
                weapon.phaseElapsedMs,
            ).toBe(0);
        }
    });

    it('creates independent mutable player ship state for each run', () => {
        const firstRun =
            createNewRunState();

        const secondRun =
            createNewRunState();

        const firstShip =
            firstRun.player.ship;

        const secondShip =
            secondRun.player.ship;

        expect(firstShip).not.toBe(
            secondShip,
        );

        expect(firstShip.drive).not.toBe(
            secondShip.drive,
        );

        expect(
            firstShip.defenseTurret,
        ).not.toBe(
            secondShip.defenseTurret,
        );

        expect(
            firstShip.powerCore,
        ).not.toBe(
            secondShip.powerCore,
        );

        expect(
            firstShip.shieldGenerator,
        ).not.toBe(
            secondShip.shieldGenerator,
        );

        expect(firstShip.weapons).not.toBe(
            secondShip.weapons,
        );

        for (
            let index = 0;
            index < firstShip.weapons.length;
            index += 1
        ) {
            expect(
                firstShip.weapons[index],
            ).not.toBe(
                secondShip.weapons[index],
            );
        }

        firstShip.hull = 0;

        firstShip.drive.status =
            SHIP_DRIVE_STATUS.DISABLED;

        firstShip.defenseTurret.phase =
            DEFENSE_TURRET_PHASE.COOLDOWN;

        firstShip.shieldGenerator.status =
            SHIELD_GENERATOR_STATUS.BROKEN;

        const firstWeapon =
            firstShip.weapons[0];

        if (!firstWeapon) {
            throw new Error(
                'Expected configured player weapon',
            );
        }

        firstWeapon.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        expect(secondShip.hull).toBe(
            SHIP_CHASSIS[
                secondShip.chassisId
            ].maxHull,
        );

        expect(
            secondShip.drive.status,
        ).toBe(
            SHIP_DRIVE_STATUS.ONLINE,
        );

        expect(
            secondShip.defenseTurret.phase,
        ).toBe(
            DEFENSE_TURRET_PHASE.READY,
        );

        expect(
            secondShip.shieldGenerator.status,
        ).toBe(
            SHIELD_GENERATOR_STATUS.ONLINE,
        );

        expect(
            secondShip.weapons[0]?.phase,
        ).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
    });
});
