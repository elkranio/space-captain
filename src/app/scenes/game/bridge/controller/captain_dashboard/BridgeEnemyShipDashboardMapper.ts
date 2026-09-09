import { DEFENSE_TURRETS } from "../../../../../../engine/content/catalogs/defense_turrets";
import { POWER_CORES } from "../../../../../../engine/content/catalogs/power_cores";
import { SHIELD_GENERATORS } from "../../../../../../engine/content/catalogs/shield_generators";
import { SHIP_CHASSIS } from "../../../../../../engine/content/catalogs/ship_chassis";
import { SHIP_DRIVES } from "../../../../../../engine/content/catalogs/ship_drives";
import { SHIP_WEAPONS } from "../../../../../../engine/content/catalogs/ship_weapons";
import type {
    EnemyShipDashboardEquipmentSnapshot,
    EnemyShipDashboardSnapshot,
} from "../../../../../../engine/encounter/combat/queries/get_enemy_ship_dashboard_snapshots";
import { getEquipmentIconSprite } from "../../../../../manifests/equipment";
import type {
    BridgeEnemyEquipmentDashboardPayload,
    BridgeEnemyShipDashboardUpdatedPayload,
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
            driveDefinition.iconId,
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
                definition.iconId,
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
                definition.iconId,
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
                definition.iconId,
                snapshot,
            ),
        );
    }

    return {
        actorId: snapshot.actorId,
        displayName: snapshot.displayName,

        chassis: {
            blueprintId: chassis.blueprintId,
            slots: chassis.slots.map((slot) => ({
                id: slot.id,
                kind: slot.kind,
                x: slot.x,
                y: slot.y,
            })),
        },

        hull: {
            ...snapshot.hull,
        },

        ...mapPowerCore(snapshot),

        ...(snapshot.beamTarget
            ? {
                  beamTarget: { ...snapshot.beamTarget },
              }
            : {}),

        equipment,
    };
}

function mapPowerCore(
    snapshot: EnemyShipDashboardSnapshot,
): Pick<NonNullable<BridgeEnemyShipDashboardUpdatedPayload>, "powerCore"> {
    const powerCore = snapshot.powerCore;

    if (!powerCore) {
        return {};
    }

    const definition = POWER_CORES[powerCore.definitionId];

    if (!definition) {
        throw new Error(
            "Enemy captain dashboard Power Core definition not found: " +
                powerCore.definitionId,
        );
    }

    return {
        powerCore: {
            id: powerCore.id,
            definitionId: powerCore.definitionId,
            slotId: getEquipmentSlotId(powerCore.id, snapshot),
            sprite: getEquipmentIconSprite(definition.iconId),

            current: powerCore.charges,
            max: powerCore.capacity,

            ...(powerCore.rechargeProgress !== undefined
                ? {
                      rechargeProgress: powerCore.rechargeProgress,
                  }
                : {}),
        },
    };
}

function mapEquipment(
    equipment: EnemyShipDashboardEquipmentSnapshot,
    shortName: string,
    iconId: string,
    dashboard: EnemyShipDashboardSnapshot,
): BridgeEnemyEquipmentDashboardPayload {
    const slotId = getEquipmentSlotId(equipment.id, dashboard);

    return {
        slotId,
        targetLocked:
            dashboard.beamTarget?.kind === "slot" &&
            dashboard.beamTarget.slotId === slotId,
        id: equipment.id,
        shortName,

        sprite: getEquipmentIconSprite(iconId),

        integrity: {
            ...equipment.integrity,
        },

        broken: equipment.integrity.current <= 0,
    };
}

function getEquipmentSlotId(
    equipmentId: string,
    dashboard: EnemyShipDashboardSnapshot,
): string {
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

    return slot.id;
}
