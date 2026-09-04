import { DEFENSE_TURRETS } from "../../../../../../engine/content/catalogs/defense_turrets";
import { SHIELD_GENERATORS } from "../../../../../../engine/content/catalogs/shield_generators";
import { SHIP_CHASSIS } from "../../../../../../engine/content/catalogs/ship_chassis";
import { SHIP_DRIVES } from "../../../../../../engine/content/catalogs/ship_drives";
import { SHIP_WEAPONS } from "../../../../../../engine/content/catalogs/ship_weapons";
import {
    SHIP_WEAPON_KIND,
    type ShipWeaponKind,
} from "../../../../../../engine/defs/ship_weapon";
import type {
    EnemyShipDashboardEquipmentSnapshot,
    EnemyShipDashboardSnapshot,
} from "../../../../../../engine/encounter/combat/queries/get_enemy_ship_dashboard_snapshots";
import {
    EQUIPMENT_SPRITE_ID,
    EQUIPMENT_SPRITES,
    type EquipmentSpriteId,
} from "../../../../../manifests/equipment";
import type {
    BridgeEnemyEquipmentDashboardPayload,
    BridgeEnemyShipDashboardUpdatedPayload,
    BridgeEquipmentSlotPayload,
} from "../../events/bridge_event";

export function mapEnemyShipToBridgeDashboardPayload(
    snapshot: EnemyShipDashboardSnapshot,
): NonNullable<BridgeEnemyShipDashboardUpdatedPayload> {
    const chassis = SHIP_CHASSIS[snapshot.chassisId];

    if (!chassis) {
        throw new Error("Enemy captain dashboard chassis not found: " + snapshot.chassisId);
    }

    const driveDefinition = SHIP_DRIVES[snapshot.drive.definitionId];

    if (!driveDefinition) {
        throw new Error(
            "Enemy captain dashboard Drive definition not found: " +
                snapshot.drive.definitionId,
        );
    }

    const equipment: BridgeEnemyEquipmentDashboardPayload[] = [
        mapEquipment(
            snapshot.drive,
            driveDefinition.shortName,
            EQUIPMENT_SPRITE_ID.DRIVE,
            snapshot,
        ),
    ];

    if (snapshot.defenseTurret) {
        const definition = DEFENSE_TURRETS[snapshot.defenseTurret.definitionId];

        if (!definition) {
            throw new Error(
                "Enemy captain dashboard Defense Turret definition not found: " +
                    snapshot.defenseTurret.definitionId,
            );
        }

        equipment.push(
            mapEquipment(
                snapshot.defenseTurret,
                definition.shortName,
                EQUIPMENT_SPRITE_ID.DEFENSE_TURRET,
                snapshot,
            ),
        );
    }

    if (snapshot.shieldGenerator) {
        const definition = SHIELD_GENERATORS[snapshot.shieldGenerator.definitionId];

        if (!definition) {
            throw new Error(
                "Enemy captain dashboard Shield Generator definition not found: " +
                    snapshot.shieldGenerator.definitionId,
            );
        }

        equipment.push(
            mapEquipment(
                snapshot.shieldGenerator,
                definition.shortName,
                EQUIPMENT_SPRITE_ID.SHIELD_GENERATOR,
                snapshot,
            ),
        );
    }

    for (const weapon of snapshot.weapons) {
        const definition = SHIP_WEAPONS[weapon.definitionId];

        if (!definition) {
            throw new Error(
                "Enemy captain dashboard weapon definition not found: " +
                    weapon.definitionId,
            );
        }

        equipment.push(
            mapEquipment(
                weapon,
                definition.shortName,
                getWeaponSpriteId(weapon.kind),
                snapshot,
            ),
        );
    }

    return {
        actorId: snapshot.actorId,
        displayName: snapshot.displayName,

        hull: {
            ...snapshot.hull,
        },

        equipment,
    };
}

function mapEquipment(
    equipment: EnemyShipDashboardEquipmentSnapshot,
    shortName: string,
    spriteId: EquipmentSpriteId,
    dashboard: EnemyShipDashboardSnapshot,
): BridgeEnemyEquipmentDashboardPayload {
    const slot = getEquipmentSlot(equipment.id, dashboard);
    return {
        slotId: slot.id,
        targetLocked: dashboard.beamTargetSlotId === slot.id,
        id: equipment.id,
        shortName,

        sprite: {
            ...EQUIPMENT_SPRITES[spriteId],
        },

        slot: { column: slot.column, row: slot.row },

        integrity: {
            ...equipment.integrity,
        },

        broken: equipment.integrity.current <= 0,
    };
}

function getEquipmentSlot(
    equipmentId: string,
    dashboard: EnemyShipDashboardSnapshot,
): BridgeEquipmentSlotPayload & { id: string } {
    const chassis = SHIP_CHASSIS[dashboard.chassisId];

    if (!chassis) {
        throw new Error("Enemy captain dashboard chassis not found: " + dashboard.chassisId);
    }

    const mount = dashboard.mounts.find((candidate) => {
        return candidate.equipmentId === equipmentId;
    });

    if (!mount) {
        throw new Error("Enemy captain dashboard equipment mount not found: " + equipmentId);
    }

    const slot = chassis.slots.find((candidate) => {
        return candidate.id === mount.slotId;
    });

    if (!slot) {
        throw new Error(
            "Enemy captain dashboard chassis slot not found: " +
                dashboard.chassisId +
                "/" +
                mount.slotId,
        );
    }

    return {
        id: slot.id,
        column: slot.column,
        row: slot.row,
    };
}

function getWeaponSpriteId(kind: ShipWeaponKind): EquipmentSpriteId {
    switch (kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
            return EQUIPMENT_SPRITE_ID.MISSILE_LAUNCHER;

        case SHIP_WEAPON_KIND.BEAM_CANNON:
            return EQUIPMENT_SPRITE_ID.BEAM_CANNON;

        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
            return EQUIPMENT_SPRITE_ID.STICKY_MINE_DISPENSER;

        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return EQUIPMENT_SPRITE_ID.SPAM_PROJECTOR;

        default: {
            const exhaustiveKind: never = kind;

            return exhaustiveKind;
        }
    }
}
