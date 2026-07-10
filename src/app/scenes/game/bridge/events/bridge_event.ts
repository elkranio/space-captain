// src\app\scenes\game\bridge\events\bridge_event.ts

import type { OfficerDefinition, OfficerRole } from '../../../../../engine/defs/officer';

export const BRIDGE_EVENT = {
    CREW_LOADED: 'crew_loaded',
    OFFICER_SEAT_CLICKED: 'officer_seat_clicked',
} as const;

export type BridgeEventPayloadMap = {
    [BRIDGE_EVENT.CREW_LOADED]: Record<OfficerRole, OfficerDefinition>;

    [BRIDGE_EVENT.OFFICER_SEAT_CLICKED]: {
        role: OfficerRole;
    };
};
