// src/engine/content/presets/ship_node_actors.ts

import {
    ENCOUNTER_TEAM,
    type EncounterTeam,
} from '../../defs/encounter_team';
import {
    SHIP_BEHAVIOR_PRESET_ID,
    type ShipBehaviorPresetId,
} from './ship_behaviors';
import {
    SHIP_CREW_PRESET_ID,
    type ShipCrewPresetId,
} from './ship_crews';
import {
    SHIP_PRESET_ID,
    type ShipPresetId,
} from './ships';

export const SHIP_NODE_ACTOR_PRESET_ID = {
    ENEMY_GENERIC_00: 'enemy_generic_00',

    ENEMY_GENERIC_BLUE_00:
        'enemy_generic_blue_00',

    ENEMY_GENERIC_LASER_00:
        'enemy_generic_laser_00',

    ENEMY_GENERIC_SPAM_00:
        'enemy_generic_spam_00',

    ENEMY_GENERIC_STICKY_MINES_00:
        'enemy_generic_sticky_mines_00',

    ENEMY_COMBAT_00:
        'enemy_combat_00',
} as const;

export type ShipNodeActorPresetId =
    (typeof SHIP_NODE_ACTOR_PRESET_ID)[keyof typeof SHIP_NODE_ACTOR_PRESET_ID];

export type ShipNodeActorPreset = {
    id: ShipNodeActorPresetId;

    team: EncounterTeam;

    shipPresetId: ShipPresetId;
    crewPresetId: ShipCrewPresetId;
    behaviorPresetId:
        ShipBehaviorPresetId;
};

export const SHIP_NODE_ACTOR_PRESETS = {
    [SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00]: {
        id:
            SHIP_NODE_ACTOR_PRESET_ID
                .ENEMY_GENERIC_00,

        team: ENCOUNTER_TEAM.ENEMY,

        shipPresetId:
            SHIP_PRESET_ID
                .GENERIC_MISSILE_RED_00,

        crewPresetId:
            SHIP_CREW_PRESET_ID.STANDARD_00,

        behaviorPresetId:
            SHIP_BEHAVIOR_PRESET_ID
                .STANDARD_COMBAT_00,
    },

    [SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BLUE_00]: {
        id:
            SHIP_NODE_ACTOR_PRESET_ID
                .ENEMY_GENERIC_BLUE_00,

        team: ENCOUNTER_TEAM.ENEMY,

        shipPresetId:
            SHIP_PRESET_ID
                .GENERIC_MISSILE_BLUE_00,

        crewPresetId:
            SHIP_CREW_PRESET_ID.STANDARD_00,

        behaviorPresetId:
            SHIP_BEHAVIOR_PRESET_ID
                .STANDARD_COMBAT_00,
    },

    [SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_LASER_00]: {
        id:
            SHIP_NODE_ACTOR_PRESET_ID
                .ENEMY_GENERIC_LASER_00,

        team: ENCOUNTER_TEAM.ENEMY,

        shipPresetId:
            SHIP_PRESET_ID
                .GENERIC_LASER_00,

        crewPresetId:
            SHIP_CREW_PRESET_ID.STANDARD_00,

        behaviorPresetId:
            SHIP_BEHAVIOR_PRESET_ID
                .STANDARD_COMBAT_00,
    },

    [SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_SPAM_00]: {
        id:
            SHIP_NODE_ACTOR_PRESET_ID
                .ENEMY_GENERIC_SPAM_00,

        team: ENCOUNTER_TEAM.ENEMY,

        shipPresetId:
            SHIP_PRESET_ID
                .GENERIC_SPAM_00,

        crewPresetId:
            SHIP_CREW_PRESET_ID.STANDARD_00,

        behaviorPresetId:
            SHIP_BEHAVIOR_PRESET_ID
                .STANDARD_COMBAT_00,
    },

    [SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_STICKY_MINES_00]: {
        id:
            SHIP_NODE_ACTOR_PRESET_ID
                .ENEMY_GENERIC_STICKY_MINES_00,

        team: ENCOUNTER_TEAM.ENEMY,

        shipPresetId:
            SHIP_PRESET_ID
                .GENERIC_STICKY_MINES_00,

        crewPresetId:
            SHIP_CREW_PRESET_ID.STANDARD_00,

        behaviorPresetId:
            SHIP_BEHAVIOR_PRESET_ID
                .STANDARD_COMBAT_00,
    },

    [SHIP_NODE_ACTOR_PRESET_ID.ENEMY_COMBAT_00]: {
        id:
            SHIP_NODE_ACTOR_PRESET_ID
                .ENEMY_COMBAT_00,

        team: ENCOUNTER_TEAM.ENEMY,

        shipPresetId:
            SHIP_PRESET_ID
                .GENERIC_COMBAT_00,

        crewPresetId:
            SHIP_CREW_PRESET_ID.STANDARD_00,

        behaviorPresetId:
            SHIP_BEHAVIOR_PRESET_ID
                .STANDARD_COMBAT_00,
    },
} satisfies Record<
    ShipNodeActorPresetId,
    ShipNodeActorPreset
>;
