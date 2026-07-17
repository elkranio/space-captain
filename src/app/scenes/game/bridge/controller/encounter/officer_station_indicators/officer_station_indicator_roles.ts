// src/app/scenes/game/bridge/controller/encounter/officer_station_indicators/officer_station_indicator_roles.ts

import { OFFICER_ROLE } from '../../../../../../../engine/defs/officer';

export const OFFICER_STATION_INDICATOR_ROLES = [
    OFFICER_ROLE.COMMS,
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.HELM,
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.ENGINEER,
] as const;
