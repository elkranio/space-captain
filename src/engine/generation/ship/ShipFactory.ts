// src/engine/generation/ship/ShipFactory.ts

import { DEFENSE_TURRETS } from "../../content/catalogs/defense_turrets";
import { SHIELD_GENERATORS } from "../../content/catalogs/shield_generators";
import { SHIP_CHASSIS } from "../../content/catalogs/ship_chassis";
import { SHIP_DRIVES } from "../../content/catalogs/ship_drives";
import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import { SHIP_PRESETS, type ShipPresetId, type ShipWeaponPreset } from "../../content/presets/ships";
import type { ShipPreset } from "../../content/presets/ships";
import type { ShipChassisDefinition } from "../../defs/ship_chassis";
import type { PowerCoreState } from "../../defs/power_core";
import type { ShipDefenseTurretState } from "../../defs/defense_turret";

import { SHIP_DRIVE_STATUS, type ShipDriveState } from "../../defs/ship_drive";
import type { ShipEquipmentMountState, ShipSlotKind } from "../../defs/ship_slot";
import { SHIP_WEAPON_KIND, type ShipWeaponState } from "../../defs/ship_weapon";
import type { ShieldGeneratorState } from "../../defs/shield_generator";
import PowerCoreFactory from "../ship_system/PowerCoreFactory";
import ShipDefenseTurretFactory from "../ship_system/ShipDefenseTurretFactory";
import ShieldGeneratorFactory from "../ship_system/ShieldGeneratorFactory";
import BeamCannonFactory from "../ship_weapon/BeamCannonFactory";
import MissileLauncherFactory from "../ship_weapon/MissileLauncherFactory";
import SpamProjectorFactory from "../ship_weapon/SpamProjectorFactory";
import StickyMineDispenserFactory from "../ship_weapon/StickyMineDispenserFactory";

export type CreateShipInput = {
    presetId: ShipPresetId;
};

export type CreatedShipState = {
    chassisId: string;

    hull: number;
    maxHull: number;

    mounts: ShipEquipmentMountState[];

    drive: ShipDriveState;

    defenseTurret?: ShipDefenseTurretState;

    powerCore?: PowerCoreState;

    shieldGenerator?: ShieldGeneratorState;

    weapons: ShipWeaponState[];
};

// Собирает свежий mutable state корабля
// из immutable chassis и ship preset.
export default class ShipFactory {
    public static create({ presetId }: CreateShipInput): CreatedShipState {
        return this.createFromPreset(SHIP_PRESETS[presetId]);
    }

    public static createFromPreset(preset: ShipPreset): CreatedShipState {
        this.validatePresetMounts(preset);

        const chassis = SHIP_CHASSIS[preset.chassisId];

        const driveDefinition = SHIP_DRIVES[preset.drive.driveId];

        return {
            chassisId: chassis.id,

            hull: chassis.maxHull,
            maxHull: chassis.maxHull,

            mounts: this.createEquipmentMounts(preset),

            drive: {
                id: preset.drive.id,

                driveId: driveDefinition.id,
                status: SHIP_DRIVE_STATUS.ONLINE,
            },

            ...(preset.defenseTurret
                ? {
                      defenseTurret: ShipDefenseTurretFactory.create({
                          id: preset.defenseTurret.id,

                          defenseTurretId: preset.defenseTurret.defenseTurretId,
                      }),
                  }
                : {}),

            ...(preset.powerCore
                ? {
                      powerCore: PowerCoreFactory.create({
                          id: preset.powerCore.id,

                          powerCoreId: preset.powerCore.powerCoreId,
                      }),
                  }
                : {}),

            ...(preset.shieldGenerator
                ? {
                      shieldGenerator: ShieldGeneratorFactory.create({
                          id: preset.shieldGenerator.id,

                          shieldGeneratorId: preset.shieldGenerator.shieldGeneratorId,
                      }),
                  }
                : {}),

            weapons: preset.weapons.map((weapon) => {
                return this.createWeapon(weapon);
            }),
        };
    }

    public static validatePresetMounts(preset: ShipPreset): void {
        const chassis = SHIP_CHASSIS[preset.chassisId];

        if (!chassis) {
            throw new Error("Ship preset references missing chassis: " + preset.id + "/" + preset.chassisId);
        }

        const occupiedSlotIds = new Set<string>();

        const driveDefinition = SHIP_DRIVES[preset.drive.driveId];

        if (!driveDefinition) {
            throw new Error("Ship preset references missing drive: " + preset.id + "/" + preset.drive.driveId);
        }

        this.claimSlot(chassis, occupiedSlotIds, preset.drive.slotId, driveDefinition.slotKind, preset.drive.id);

        if (preset.defenseTurret) {
            const definition = DEFENSE_TURRETS[preset.defenseTurret.defenseTurretId];

            if (!definition) {
                throw new Error(
                    "Ship preset references missing Defense Turret: " +
                        preset.id +
                        "/" +
                        preset.defenseTurret.defenseTurretId,
                );
            }

            this.claimSlot(
                chassis,
                occupiedSlotIds,
                preset.defenseTurret.slotId,
                definition.slotKind,
                preset.defenseTurret.id,
            );
        }

        if (preset.shieldGenerator) {
            const definition = SHIELD_GENERATORS[preset.shieldGenerator.shieldGeneratorId];

            if (!definition) {
                throw new Error(
                    "Ship preset references missing Shield Generator: " +
                        preset.id +
                        "/" +
                        preset.shieldGenerator.shieldGeneratorId,
                );
            }

            this.claimSlot(
                chassis,
                occupiedSlotIds,
                preset.shieldGenerator.slotId,
                definition.slotKind,
                preset.shieldGenerator.id,
            );
        }

        for (const weapon of preset.weapons) {
            const definition = SHIP_WEAPONS[weapon.weaponId];

            if (!definition) {
                throw new Error("Ship preset references missing weapon: " + preset.id + "/" + weapon.weaponId);
            }

            if (definition.kind !== weapon.kind) {
                throw new Error(
                    "Ship preset weapon kind mismatch: " +
                        weapon.id +
                        "/" +
                        weapon.kind +
                        " -> " +
                        definition.id +
                        "/" +
                        definition.kind,
                );
            }

            this.claimSlot(chassis, occupiedSlotIds, weapon.slotId, definition.slotKind, weapon.id);
        }
    }

    private static createEquipmentMounts(preset: ShipPreset): ShipEquipmentMountState[] {
        const mounts: ShipEquipmentMountState[] = [
            {
                slotId: preset.drive.slotId,
                equipmentId: preset.drive.id,
            },
        ];

        if (preset.defenseTurret) {
            mounts.push({
                slotId: preset.defenseTurret.slotId,
                equipmentId: preset.defenseTurret.id,
            });
        }

        if (preset.shieldGenerator) {
            mounts.push({
                slotId: preset.shieldGenerator.slotId,
                equipmentId: preset.shieldGenerator.id,
            });
        }

        for (const weapon of preset.weapons) {
            mounts.push({
                slotId: weapon.slotId,
                equipmentId: weapon.id,
            });
        }

        return mounts;
    }

    private static claimSlot(
        chassis: ShipChassisDefinition,
        occupiedSlotIds: Set<string>,
        slotId: string,
        equipmentSlotKind: ShipSlotKind,
        equipmentId: string,
    ): void {
        const slot = chassis.slots.find((candidate) => {
            return candidate.id === slotId;
        });

        if (!slot) {
            throw new Error("Ship equipment references missing chassis slot: " + equipmentId + "/" + slotId);
        }

        if (slot.kind !== equipmentSlotKind) {
            throw new Error(
                "Ship equipment slot kind mismatch: " +
                    equipmentId +
                    "/" +
                    equipmentSlotKind +
                    " -> " +
                    slot.id +
                    "/" +
                    slot.kind,
            );
        }

        if (occupiedSlotIds.has(slot.id)) {
            throw new Error("Ship chassis slot is mounted more than once: " + slot.id);
        }

        occupiedSlotIds.add(slot.id);
    }

    private static createWeapon(preset: ShipWeaponPreset): ShipWeaponState {
        switch (preset.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                return MissileLauncherFactory.create({
                    id: preset.id,

                    weaponId: preset.weaponId,
                });

            case SHIP_WEAPON_KIND.BEAM_CANNON:
                return BeamCannonFactory.create({
                    id: preset.id,

                    weaponId: preset.weaponId,
                });

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                return SpamProjectorFactory.create({
                    id: preset.id,

                    weaponId: preset.weaponId,
                });

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                return StickyMineDispenserFactory.create({
                    id: preset.id,

                    weaponId: preset.weaponId,
                });
        }
    }
}
