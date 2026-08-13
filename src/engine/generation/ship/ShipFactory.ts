// src/engine/generation/ship/ShipFactory.ts

import {
    SHIP_CHASSIS,
} from '../../content/catalogs/ship_chassis';
import {
    SHIP_DRIVES,
} from '../../content/catalogs/ship_drives';
import {
    SHIP_PRESETS,
    type ShipPresetId,
    type ShipWeaponPreset,
} from '../../content/presets/ships';
import type { ShipPreset } from '../../content/presets/ships';
import type {
    PowerCoreState,
} from '../../defs/power_core';
import type {
    ShipPointDefenseState,
} from '../../defs/point_defense';
import type {
    ShipChassisId,
} from '../../defs/ship_chassis';
import {
    SHIP_DRIVE_STATUS,
    type ShipDriveState,
} from '../../defs/ship_drive';
import {
    SHIP_WEAPON_KIND,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type {
    ShieldEmitterState,
} from '../../defs/shield_emitter';
import PowerCoreFactory from '../ship_system/PowerCoreFactory';
import ShipPointDefenseFactory from '../ship_system/ShipPointDefenseFactory';
import ShieldEmitterFactory from '../ship_system/ShieldEmitterFactory';
import LaserWeaponFactory from '../ship_weapon/LaserWeaponFactory';
import MissileLauncherFactory from '../ship_weapon/MissileLauncherFactory';
import SpamProjectorFactory from '../ship_weapon/SpamProjectorFactory';
import StickyMineDispenserFactory from '../ship_weapon/StickyMineDispenserFactory';

export type CreateShipInput = {
    presetId: ShipPresetId;
};

export type CreatedShipState = {
    chassisId: ShipChassisId;

    hull: number;
    maxHull: number;

    drive: ShipDriveState;

    pointDefense?: ShipPointDefenseState;

    powerCore?:
        PowerCoreState;

    shieldEmitter?:
        ShieldEmitterState;

    weapons: ShipWeaponState[];
};

// Собирает свежий mutable state корабля
// из immutable chassis и ship preset.
export default class ShipFactory {
    public static create({
        presetId,
    }: CreateShipInput): CreatedShipState {
        const preset: ShipPreset =
            SHIP_PRESETS[presetId];

        const chassis =
            SHIP_CHASSIS[preset.chassisId];

        const driveDefinition =
            SHIP_DRIVES[preset.drive.driveId];

        return {
            chassisId: chassis.id,

            hull: chassis.maxHull,
            maxHull: chassis.maxHull,

            drive: {
                id: preset.drive.id,

                driveId: driveDefinition.id,
                status:
                    SHIP_DRIVE_STATUS.ONLINE,
            },

            ...(
                preset.pointDefense
                    ? {
                          pointDefense:
                              ShipPointDefenseFactory.create({
                                  id:
                                      preset
                                          .pointDefense
                                          .id,

                                  pointDefenseId:
                                      preset
                                          .pointDefense
                                          .pointDefenseId,
                              }),
                      }
                    : {}
            ),

            ...(
                preset.powerCore
                    ? {
                          powerCore:
                              PowerCoreFactory.create({
                                  id:
                                      preset
                                          .powerCore
                                          .id,

                                  powerCoreId:
                                      preset
                                          .powerCore
                                          .powerCoreId,
                              }),
                      }
                    : {}
            ),

            ...(
                preset.shieldEmitter
                    ? {
                          shieldEmitter:
                              ShieldEmitterFactory.create({
                                  id:
                                      preset
                                          .shieldEmitter
                                          .id,

                                  shieldEmitterId:
                                      preset
                                          .shieldEmitter
                                          .shieldEmitterId,
                              }),
                      }
                    : {}
            ),

            weapons: preset.weapons.map(
                (weapon) => {
                    return this.createWeapon(
                        weapon,
                    );
                },
            ),
        };
    }

    private static createWeapon(
        preset: ShipWeaponPreset,
    ): ShipWeaponState {
        switch (preset.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                return MissileLauncherFactory.create({
                    id: preset.id,

                    presetId: preset.presetId,
                });

            case SHIP_WEAPON_KIND.LASER:
                return LaserWeaponFactory.create({
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

                    presetId: preset.presetId,
                });
        }
    }
}
