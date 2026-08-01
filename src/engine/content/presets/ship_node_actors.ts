// src/engine/content/presets/ship_node_actors.ts

import { ENCOUNTER_TEAM, type EncounterTeam } from '../../defs/encounter_team';
import { SHIP_CHASSIS_ID, type ShipChassisId } from '../../defs/ship_chassis';
import { SHIP_WEAPON_ID, SHIP_WEAPON_KIND } from '../../defs/ship_weapon';
import { MISSILE_LAUNCHER_PRESET_ID, type MissileLauncherPresetId } from './missile_launchers';

export const SHIP_NODE_ACTOR_PRESET_ID = {
    ENEMY_GENERIC_00: 'enemy_generic_00',

    ENEMY_GENERIC_BLUE_00: 'enemy_generic_blue_00',

    ENEMY_GENERIC_LASER_00: 'enemy_generic_laser_00',

    ENEMY_GENERIC_SPAM_00: 'enemy_generic_spam_00',

    ENEMY_GENERIC_STICKY_MINES_00:
        'enemy_generic_sticky_mines_00',
} as const;

export type ShipNodeActorPresetId = (typeof SHIP_NODE_ACTOR_PRESET_ID)[keyof typeof SHIP_NODE_ACTOR_PRESET_ID];

type MissileLauncherShipNodeActorWeaponPreset = {
    // Runtime id оружия внутри корабля.
    id: string;

    kind: typeof SHIP_WEAPON_KIND.MISSILE_LAUNCHER;

    presetId: MissileLauncherPresetId;
};

type LaserShipNodeActorWeaponPreset = {
    // Runtime id оружия внутри корабля.
    id: string;

    kind: typeof SHIP_WEAPON_KIND.LASER;

    weaponId: typeof SHIP_WEAPON_ID.LASER_00;
};

type SpamProjectorShipNodeActorWeaponPreset = {
    // Runtime id оружия внутри корабля.
    id: string;

    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;

    weaponId: typeof SHIP_WEAPON_ID.SPAM_PROJECTOR_00;
};

type StickyMineDispenserShipNodeActorWeaponPreset = {
    // Runtime id оружия внутри корабля.
    id: string;

    kind:
        typeof SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER;

    weaponId:
        typeof SHIP_WEAPON_ID.STICKY_MINE_DISPENSER_00;
};

export type ShipNodeActorWeaponPreset =
    | MissileLauncherShipNodeActorWeaponPreset
    | LaserShipNodeActorWeaponPreset
    | SpamProjectorShipNodeActorWeaponPreset
    | StickyMineDispenserShipNodeActorWeaponPreset;

export type ShipNodeActorPreset = {
    id: ShipNodeActorPresetId;

    team: EncounterTeam;
    chassisId: ShipChassisId;

    weapons: ShipNodeActorWeaponPreset[];
};

export const SHIP_NODE_ACTOR_PRESETS = {
    [SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00]: {
        id: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

        team: ENCOUNTER_TEAM.ENEMY,
        chassisId: SHIP_CHASSIS_ID.GENERIC_00,

        weapons: [
            {
                id: 'missile_launcher_00',

                kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

                presetId: MISSILE_LAUNCHER_PRESET_ID.BASIC_RED_FULL_00,
            },
        ],
    },

    [SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BLUE_00]: {
        id: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BLUE_00,

        team: ENCOUNTER_TEAM.ENEMY,
        chassisId: SHIP_CHASSIS_ID.GENERIC_00,

        weapons: [
            {
                id: 'missile_launcher_00',

                kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

                presetId: MISSILE_LAUNCHER_PRESET_ID.BASIC_BLUE_FULL_00,
            },
        ],
    },

    [SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_LASER_00]: {
        id: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_LASER_00,

        team: ENCOUNTER_TEAM.ENEMY,
        chassisId: SHIP_CHASSIS_ID.GENERIC_00,

        weapons: [
            {
                id: 'laser_00',

                kind: SHIP_WEAPON_KIND.LASER,

                weaponId: SHIP_WEAPON_ID.LASER_00,
            },
        ],
    },

    [SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_SPAM_00]: {
        id: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_SPAM_00,

        team: ENCOUNTER_TEAM.ENEMY,
        chassisId: SHIP_CHASSIS_ID.GENERIC_00,

        weapons: [
            {
                id: 'spam_projector_00',

                kind: SHIP_WEAPON_KIND.SPAM_PROJECTOR,

                weaponId: SHIP_WEAPON_ID.SPAM_PROJECTOR_00,
            },
        ],
    },

    [SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_STICKY_MINES_00]: {
        id:
            SHIP_NODE_ACTOR_PRESET_ID
                .ENEMY_GENERIC_STICKY_MINES_00,

        team: ENCOUNTER_TEAM.ENEMY,
        chassisId: SHIP_CHASSIS_ID.GENERIC_00,

        weapons: [
            {
                id:
                    'sticky_mine_dispenser_00',

                kind:
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER,

                weaponId:
                    SHIP_WEAPON_ID
                        .STICKY_MINE_DISPENSER_00,
            },
        ],
    },
} satisfies Record<ShipNodeActorPresetId, ShipNodeActorPreset>;
