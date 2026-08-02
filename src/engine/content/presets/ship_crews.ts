// src/engine/content/presets/ship_crews.ts

import type {
    CrewTraitsByRole,
} from '../../defs/crew_trait';
import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../defs/officer';

export const SHIP_CREW_PRESET_ID = {
    STANDARD_00: 'standard_00',
} as const;

export type ShipCrewPresetId =
    (typeof SHIP_CREW_PRESET_ID)[keyof typeof SHIP_CREW_PRESET_ID];

export type ShipCrewPreset = {
    id: ShipCrewPresetId;

    // Абстрактные роли, которые физически
    // доступны экипажу NPC-корабля.
    roles: OfficerRole[];

    // Стартовые traits конкретных ролей.
    // Генератор конкретного actor сможет
    // дополнить или заменить этот набор позже.
    traitsByRole: CrewTraitsByRole;
};

export const SHIP_CREW_PRESETS = {
    [SHIP_CREW_PRESET_ID.STANDARD_00]: {
        id: SHIP_CREW_PRESET_ID.STANDARD_00,

        roles: [
            OFFICER_ROLE.COMMS,
            OFFICER_ROLE.SCIENCE,
            OFFICER_ROLE.HELM,
            OFFICER_ROLE.WEAPONS,
            OFFICER_ROLE.ENGINEER,
        ],

        traitsByRole: {},
    },
} satisfies Record<
    ShipCrewPresetId,
    ShipCrewPreset
>;
