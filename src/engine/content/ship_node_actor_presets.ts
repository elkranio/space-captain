// src/engine/content/ship_node_actor_presets.ts

import { MISSILE_LAUNCHER_PRESET_ID, type MissileLauncherPresetId } from './ship_weapon_presets';
import { ENCOUNTER_TEAM, type EncounterTeam } from '../defs/encounter_team';
import { SHIP_ID, type ShipId } from '../defs/ship';
import { SHIP_WEAPON_KIND } from '../defs/ship_weapon';

export const SHIP_NODE_ACTOR_PRESET_ID = {
    ENEMY_GENERIC_00: 'enemy_generic_00',
} as const;

export type ShipNodeActorPresetId = (typeof SHIP_NODE_ACTOR_PRESET_ID)[keyof typeof SHIP_NODE_ACTOR_PRESET_ID];

export type ShipNodeActorWeaponPreset = {
    // Runtime id оружия внутри корабля.
    id: string;

    kind: typeof SHIP_WEAPON_KIND.MISSILE_LAUNCHER;

    presetId: MissileLauncherPresetId;
};

export type ShipNodeActorPreset = {
    id: ShipNodeActorPresetId;

    team: EncounterTeam;
    shipId: ShipId;

    weapons: ShipNodeActorWeaponPreset[];
};

export const SHIP_NODE_ACTOR_PRESETS = {
    [SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00]: {
        id: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

        team: ENCOUNTER_TEAM.ENEMY,
        shipId: SHIP_ID.GENERIC_00,

        weapons: [
            {
                id: 'missile_launcher_00',

                kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

                presetId: MISSILE_LAUNCHER_PRESET_ID.BASIC_HEAT_FULL_00,
            },
        ],
    },
} satisfies Record<ShipNodeActorPresetId, ShipNodeActorPreset>;
