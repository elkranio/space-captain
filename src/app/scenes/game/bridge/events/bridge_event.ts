// src\app\scenes\game\bridge\events\bridge_event.ts

import type { OfficerDefinition, OfficerRole } from '../../../../../engine/defs/officer';
import type { SpriteEntry } from '../../../../manifests/types';

export const BRIDGE_EVENT = {
    CREW_LOADED: 'crew_loaded',
    OFFICER_SEAT_CLICKED: 'officer_seat_clicked',
    ENCOUNTER_OBJECTS_SYNCED: 'encounter_objects_synced',
} as const;

export type BridgeEncounterObjectViewState = {
    id: string;
    sprite: SpriteEntry;
    position: Phaser.Math.Vector2;
    scale: number;
};

export type BridgeEventPayloadMap = {
    [BRIDGE_EVENT.CREW_LOADED]: Record<OfficerRole, OfficerDefinition>;
    [BRIDGE_EVENT.OFFICER_SEAT_CLICKED]: { role: OfficerRole };
    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED]: BridgeEncounterObjectViewState[];
};
