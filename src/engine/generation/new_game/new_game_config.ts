// src/engine/generation/new_game/new_game_config.ts

import { OFFICER_PORTRAIT_ID, OFFICER_ROLE, type OfficerDefinition, type OfficerRole } from "../../defs/officer";
import type { NewGamePlayerLocations } from "./NewGameUniverseFactory";

type NewGameConfig = {
    player: {
        locationId: keyof NewGamePlayerLocations;
    };

    officers: Record<OfficerRole, OfficerDefinition>;
};

// Стартовая позиция player и состав офицеров.
//
// Chassis, железо и spatial mounts Debug Start живут вместе
// в debug_start.json. Геометрия nodes, anchors и actors остаётся
// внутри NewGameUniverseFactory: это связный universe scenario.
export const NEW_GAME_CONFIG = {
    player: {
        locationId: "arrivingAtStart",
    },

    officers: {
        [OFFICER_ROLE.SCIENTIST]: {
            role: OFFICER_ROLE.SCIENTIST,
            name: "Dr. Zella Quark",

            portraitId: OFFICER_PORTRAIT_ID.SCIENTIST_ALIEN_00,
        },

        [OFFICER_ROLE.PILOT]: {
            role: OFFICER_ROLE.PILOT,
            name: "Dash Nulligan",

            portraitId: OFFICER_PORTRAIT_ID.PILOT_HUMAN_00,
        },

        [OFFICER_ROLE.GUNNER]: {
            role: OFFICER_ROLE.GUNNER,
            name: "Buck Varnish",

            portraitId: OFFICER_PORTRAIT_ID.GUNNER_ALIEN_00,
        },

        [OFFICER_ROLE.ENGINEER]: {
            role: OFFICER_ROLE.ENGINEER,
            name: "Mira Wrenchly",

            portraitId: OFFICER_PORTRAIT_ID.ENGINEER_HUMAN_00,
        },
    },
} as const satisfies NewGameConfig;

export function createNewGameOfficers(): Record<OfficerRole, OfficerDefinition> {
    const officers = NEW_GAME_CONFIG.officers;

    return {
        [OFFICER_ROLE.SCIENTIST]: {
            ...officers[OFFICER_ROLE.SCIENTIST],
        },

        [OFFICER_ROLE.PILOT]: {
            ...officers[OFFICER_ROLE.PILOT],
        },

        [OFFICER_ROLE.GUNNER]: {
            ...officers[OFFICER_ROLE.GUNNER],
        },

        [OFFICER_ROLE.ENGINEER]: {
            ...officers[OFFICER_ROLE.ENGINEER],
        },
    };
}
