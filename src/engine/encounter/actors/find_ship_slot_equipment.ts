import { SHIP_CHASSIS } from "../../content/catalogs/ship_chassis";
import type { EncounterEquipmentIntegrityState } from "../model/equipment";
import type { ShipEncounterActorState } from "./ship_encounter_actor";

// Slot identity resolves the currently mounted equipment, never its array position or family.
export function findShipSlotEquipment(
    actor: ShipEncounterActorState, slotId: string,
): EncounterEquipmentIntegrityState | undefined {
    if (!SHIP_CHASSIS[actor.chassisId]?.slots.some((slot) => slot.id === slotId)) {
        return undefined;
    }

    const mount = actor.mounts.find((candidate) => candidate.slotId === slotId);
    if (!mount) {
        return undefined;
    }

    const id = mount.equipmentId;
    if (actor.drive.id === id) return actor.drive;
    if (actor.defenseTurret?.id === id) return actor.defenseTurret;
    if (actor.shieldGenerator?.id === id) return actor.shieldGenerator;
    return actor.weapons.find((weapon) => weapon.id === id);
}
