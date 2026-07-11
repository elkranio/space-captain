// src/engine/content/new_game.ts

import { GAME_LOCATION, type GameLocation } from '../defs/game_location';
import { OFFICER_PORTRAIT_ID, OFFICER_ROLE, type OfficerDefinition, type OfficerRole } from '../defs/officer';

export type NewGameDefinition = {
    game_location: GameLocation;
    officers: Record<OfficerRole, OfficerDefinition>;
};

export const NEW_GAME = {
    game_location: GAME_LOCATION.BRIDGE,

    officers: {
        [OFFICER_ROLE.COMMS]: {
            role: OFFICER_ROLE.COMMS,
            name: 'Pip Voxley',
            portraitId: OFFICER_PORTRAIT_ID.COMMS_HUMAN_00,
        },

        [OFFICER_ROLE.SCIENCE]: {
            role: OFFICER_ROLE.SCIENCE,
            name: 'Dr. Zella Quark',
            portraitId: OFFICER_PORTRAIT_ID.SCIENCE_ALIEN_00,
        },

        [OFFICER_ROLE.HELM]: {
            role: OFFICER_ROLE.HELM,
            name: 'Dash Nulligan',
            portraitId: OFFICER_PORTRAIT_ID.HELM_HUMAN_00,
        },

        [OFFICER_ROLE.WEAPONS]: {
            role: OFFICER_ROLE.WEAPONS,
            name: 'Buck Varnish',
            portraitId: OFFICER_PORTRAIT_ID.WEAPONS_ALIEN_00,
        },

        [OFFICER_ROLE.ENGINEER]: {
            role: OFFICER_ROLE.ENGINEER,
            name: 'Mira Wrenchly',
            portraitId: OFFICER_PORTRAIT_ID.ENGINEER_HUMAN_00,
        },
    },
} satisfies NewGameDefinition;
