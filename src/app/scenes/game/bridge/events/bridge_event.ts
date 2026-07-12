// src\app\scenes\game\bridge\events\bridge_event.ts

import type { OfficerDefinition, OfficerRole } from '../../../../../engine/defs/officer';
import type { SpriteEntry } from '../../../../manifests/types';

export const BRIDGE_EVENT = {
    CREW_LOADED: 'crew_loaded',
    OFFICER_SEAT_CLICKED: 'officer_seat_clicked',

    ENCOUNTER_OBJECTS_PREPARED: 'encounter_objects_prepared',
    ENCOUNTER_OBJECTS_SYNCED: 'encounter_objects_synced',

    ENCOUNTER_ARRIVAL_STARTED: 'encounter_arrival_started',
    ENCOUNTER_ARRIVAL_COMPLETED: 'encounter_arrival_completed',
} as const;

export type BridgeEncounterObjectViewState = {
    id: string;
    sprite: SpriteEntry;
    position: Phaser.Math.Vector2;
};

export type BridgeEventPayloadMap = {
    [BRIDGE_EVENT.CREW_LOADED]: Record<OfficerRole, OfficerDefinition>;
    [BRIDGE_EVENT.OFFICER_SEAT_CLICKED]: {
        role: OfficerRole;
    };
    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_PREPARED]: BridgeEncounterObjectViewState[];
    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED]: BridgeEncounterObjectViewState[];
    [BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED]: undefined;
    [BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED]: undefined;
};
