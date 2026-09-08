import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import { describe, expect, it } from 'vitest';
import { DEBUG_START } from '../../../src/engine/content/catalogs/debug_start';
import { SHIP_CHASSIS } from '../../../src/engine/content/catalogs/ship_chassis';
import { SHIP_SLOT_KIND } from '../../../src/engine/defs/ship_slot';
import {
    createDebugStartEnemyShip,
    createDebugStartPlayerShip,
} from '../../../src/engine/generation/new_game/debug_start_ship_factory';

describe('Debug Start ship factory', () => {
    it('creates the player through the configured chassis and shared ShipFactory path', () => {
        const ship = createDebugStartPlayerShip();

        expect(ship.chassisId).toBe(DEBUG_START.player.chassisId);

        const expectedHull = SHIP_CHASSIS[DEBUG_START.player.chassisId].maxHull;

        expect(ship.hull).toBe(expectedHull);
        expect(ship.maxHull).toBe(expectedHull);

        const powerCoreSlot = SHIP_CHASSIS[DEBUG_START.player.chassisId].slots.find((slot) => {
            return slot.kind === SHIP_SLOT_KIND.POWER_CORE;
        });

        if (!powerCoreSlot) {
            throw new Error('Debug Start player chassis is missing its Power Core slot');
        }

        expect(ship.mounts.map((mount) => mount.slotId).sort()).toEqual(
            [...DEBUG_START.player.equipment.map((equipment) => equipment.slotId), powerCoreSlot.id].sort(),
        );

        expect(ship.mounts).toContainEqual({
            slotId: powerCoreSlot.id,
            equipmentId: ship.powerCore.id,
        });

        const equipment = DEBUG_START.player.equipment.filter((item) => item.type === 'weapon');
        expect(ship.weapons.map((weapon) => ({ kind: weapon.kind, weaponId: weapon.weaponId }))).toEqual(
            equipment.map((item) => ({
                kind: SHIP_WEAPONS[item.equipmentId].kind,
                weaponId: item.equipmentId,
            })),
        );
        expect(new Set(ship.weapons.map((weapon) => weapon.id)).size).toBe(equipment.length);
    });

    it('keeps the enemy on its configured chassis', () => {
        const ship = createDebugStartEnemyShip();

        expect(ship.chassisId).toBe(DEBUG_START.enemy.chassisId);

        const expectedHull = SHIP_CHASSIS[DEBUG_START.enemy.chassisId].maxHull;

        expect(ship.hull).toBe(expectedHull);
        expect(ship.maxHull).toBe(expectedHull);
    });
});
