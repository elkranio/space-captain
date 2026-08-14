// src/engine/content/new_game/create_new_game_player.ts

import type {
    PlayerState,
    PlayerShipState,
} from '../../defs/player';
import type {
    PlayerLocationState,
} from '../../defs/player_location';
import {
    SHIP_DRIVE_STATUS,
} from '../../defs/ship_drive';
import {
    SHIP_WEAPON_ID,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import PowerCoreFactory from '../../generation/ship_system/PowerCoreFactory';
import ShipDefenseTurretFactory from '../../generation/ship_system/ShipDefenseTurretFactory';
import ShieldGeneratorFactory from '../../generation/ship_system/ShieldGeneratorFactory';
import LaserWeaponFactory from '../../generation/ship_weapon/LaserWeaponFactory';
import MissileLauncherFactory from '../../generation/ship_weapon/MissileLauncherFactory';
import SpamProjectorFactory from '../../generation/ship_weapon/SpamProjectorFactory';
import StickyMineDispenserFactory from '../../generation/ship_weapon/StickyMineDispenserFactory';
import {
    SHIP_DRIVES,
} from '../catalogs/ship_drives';
import {
    PLAYER_SHIP_PRESETS,
    type PlayerShipPresetId,
    type PlayerShipWeaponPreset,
} from '../presets/player_ships';

const NEW_GAME_PLAYER_SHIP_SYSTEM_ID = {
    DRIVE: 'drive_player_00',
} as const;

export function createNewGamePlayer(
    location: PlayerLocationState,
    shipPresetId: PlayerShipPresetId,
): PlayerState {
    return {
        ship: createPlayerShip(shipPresetId),
        location,
    };
}

function createPlayerShip(
    presetId: PlayerShipPresetId,
): PlayerShipState {
    const preset =
        PLAYER_SHIP_PRESETS[presetId];

    const drive =
        SHIP_DRIVES[preset.driveId];

    return {
        hull: preset.maxHull,
        maxHull: preset.maxHull,

        drive: {
            id:
                NEW_GAME_PLAYER_SHIP_SYSTEM_ID
                    .DRIVE,

            driveId: drive.id,
            status:
                SHIP_DRIVE_STATUS.ONLINE,
        },

        defenseTurret:
            ShipDefenseTurretFactory.create({
                id:
                    preset
                        .defenseTurret
                        .id,

                defenseTurretId:
                    preset
                        .defenseTurret
                        .defenseTurretId,
            }),

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

        shieldGenerator:
            ShieldGeneratorFactory.create({
                id:
                    preset
                        .shieldGenerator
                        .id,

                shieldGeneratorId:
                    preset
                        .shieldGenerator
                        .shieldGeneratorId,
            }),

        weapons:
            preset.weapons.map(
                createPlayerWeapon,
            ),
    };
}

function createPlayerWeapon(
    weapon: PlayerShipWeaponPreset,
): ShipWeaponState {
    switch (weapon.weaponId) {
        case SHIP_WEAPON_ID.LASER_00:
            return LaserWeaponFactory.create({
                id: weapon.id,

                weaponId:
                    weapon.weaponId,
            });

        case SHIP_WEAPON_ID
            .MISSILE_LAUNCHER_00:
            return MissileLauncherFactory.create({
                id: weapon.id,

                weaponId:
                    weapon.weaponId,
            });

        case SHIP_WEAPON_ID
            .SPAM_PROJECTOR_00:
            return SpamProjectorFactory.create({
                id: weapon.id,

                weaponId:
                    weapon.weaponId,
            });

        case SHIP_WEAPON_ID
            .STICKY_MINE_DISPENSER_00:
            return StickyMineDispenserFactory.create({
                id: weapon.id,

                presetId:
                    weapon.presetId,
            });

        default:
            return assertNever(weapon);
    }
}

function assertNever(
    value: never,
): never {
    throw new Error(
        'Unhandled player ship weapon preset: ' +
            String(value),
    );
}
