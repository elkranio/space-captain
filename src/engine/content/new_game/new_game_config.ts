// src/engine/content/new_game/new_game_config.ts

import {
    OFFICER_PORTRAIT_ID,
    OFFICER_ROLE,
    type OfficerDefinition,
    type OfficerRole,
} from '../../defs/officer';
import {
    PLAYER_SHIP_PRESET_ID,
    type PlayerShipPresetId,
} from '../presets/player_ships';
import type { NewGamePlayerLocations } from './NewGameUniverseFactory';

type NewGameConfig = {
    player: {
        locationId: keyof NewGamePlayerLocations;
        shipPresetId: PlayerShipPresetId;
    };

    officers: Record<OfficerRole, OfficerDefinition>;
};

// Единственная точка выбора стартовых условий run.
//
// Геометрия nodes, anchors и actors остаётся внутри
// NewGameUniverseFactory: это связный universe scenario,
// а не набор независимых runtime-настроек.
export const NEW_GAME_CONFIG = {
    player: {
        locationId: 'arrivingAtStart',

        shipPresetId:
            PLAYER_SHIP_PRESET_ID.STARTER_00,
    },

    officers: {
        [OFFICER_ROLE.COMMS]: {
            role: OFFICER_ROLE.COMMS,
            name: 'Pip Voxley',

            portraitId:
                OFFICER_PORTRAIT_ID.COMMS_HUMAN_00,
        },

        [OFFICER_ROLE.SCIENCE]: {
            role: OFFICER_ROLE.SCIENCE,
            name: 'Dr. Zella Quark',

            portraitId:
                OFFICER_PORTRAIT_ID.SCIENCE_ALIEN_00,
        },

        [OFFICER_ROLE.HELM]: {
            role: OFFICER_ROLE.HELM,
            name: 'Dash Nulligan',

            portraitId:
                OFFICER_PORTRAIT_ID.HELM_HUMAN_00,
        },

        [OFFICER_ROLE.WEAPONS]: {
            role: OFFICER_ROLE.WEAPONS,
            name: 'Buck Varnish',

            portraitId:
                OFFICER_PORTRAIT_ID.WEAPONS_ALIEN_00,
        },

        [OFFICER_ROLE.ENGINEER]: {
            role: OFFICER_ROLE.ENGINEER,
            name: 'Mira Wrenchly',

            portraitId:
                OFFICER_PORTRAIT_ID.ENGINEER_HUMAN_00,
        },
    },
} as const satisfies NewGameConfig;

export function createNewGameOfficers(): Record<
    OfficerRole,
    OfficerDefinition
> {
    const officers = NEW_GAME_CONFIG.officers;

    return {
        [OFFICER_ROLE.COMMS]: {
            ...officers[OFFICER_ROLE.COMMS],
        },

        [OFFICER_ROLE.SCIENCE]: {
            ...officers[OFFICER_ROLE.SCIENCE],
        },

        [OFFICER_ROLE.HELM]: {
            ...officers[OFFICER_ROLE.HELM],
        },

        [OFFICER_ROLE.WEAPONS]: {
            ...officers[OFFICER_ROLE.WEAPONS],
        },

        [OFFICER_ROLE.ENGINEER]: {
            ...officers[OFFICER_ROLE.ENGINEER],
        },
    };
}
