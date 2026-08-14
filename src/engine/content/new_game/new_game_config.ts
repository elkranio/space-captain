// src/engine/content/new_game/new_game_config.ts

import {
    OFFICER_PORTRAIT_ID,
    OFFICER_ROLE,
    type OfficerDefinition,
    type OfficerRole,
} from '../../defs/officer';
import type { NewGamePlayerLocations } from './NewGameUniverseFactory';

type NewGameConfig = {
    player: {
        locationId: keyof NewGamePlayerLocations;
    };

    officers: Record<OfficerRole, OfficerDefinition>;
};

// Единственная точка выбора стартовой позиции и экипажа run.
//
// Стартовое железо player/enemy живёт отдельно в debug_start.json.
// Геометрия nodes, anchors и actors остаётся внутри
// NewGameUniverseFactory: это связный universe scenario.
export const NEW_GAME_CONFIG = {
    player: {
        locationId: 'arrivingAtStart',
    },

    officers: {
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
