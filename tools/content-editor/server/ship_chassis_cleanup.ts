import { promises as fs } from 'node:fs';
import path from 'node:path';
import { SHIPS_SCHEMA, type ShipsData } from '../../../src/engine/content/schemas/ships';
import { SHIP_CHASSIS_TUNING_SCHEMA } from '../../../src/engine/content/schemas/ship_chassis';
import { ContentReferenceError } from './content_references';

export type ShipChassisDependentCleanup = {
    ships: ShipsData;
    removedEquipmentMounts: number;
};

export async function createShipChassisDependentCleanup(
    repoRoot: string,
    currentData: unknown,
    nextData: unknown,
): Promise<ShipChassisDependentCleanup | undefined> {
    const currentChassis = SHIP_CHASSIS_TUNING_SCHEMA.parse(currentData);
    const nextChassis = SHIP_CHASSIS_TUNING_SCHEMA.parse(nextData);
    const ships = SHIPS_SCHEMA.parse(JSON.parse(await fs.readFile(
        path.join(repoRoot, 'src/engine/content/data/ships.json'), 'utf8',
    )));
    let removedEquipmentMounts = 0;

    for (const [id, ship] of Object.entries(ships)) {
        const current = currentChassis[ship.chassisId];
        const next = nextChassis[ship.chassisId];
        if (!current || !next) continue; // Chassis deletion is blocked by reference validation.
        ship.equipment = ship.equipment.filter(mount => {
            const oldSlot = current.slots.find(slot => slot.id === mount.slotId);
            const newSlot = next.slots.find(slot => slot.id === mount.slotId);
            if (oldSlot && newSlot && oldSlot.kind === newSlot.kind) return true;
            if (mount.type === 'drive') {
                throw new ContentReferenceError('Cannot remove or change Drive slot "' + mount.slotId +
                    '": it is used by ship "' + id + '". Choose another chassis for this ship first.', 409);
            }
            removedEquipmentMounts += 1;
            return false;
        });
    }

    if (removedEquipmentMounts === 0) return undefined;
    return { ships: SHIPS_SCHEMA.parse(ships), removedEquipmentMounts };
}
