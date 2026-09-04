import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import { describe, expect, it } from 'vitest';
import { DEBUG_START } from '../../../src/engine/content/catalogs/debug_start';
import { SHIP_CHASSIS } from '../../../src/engine/content/catalogs/ship_chassis';
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

        expect(ship.mounts.map((mount) => mount.slotId).sort()).toEqual(
            DEBUG_START.player.equipment.map((equipment) => equipment.slotId).sort(),
        );

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
