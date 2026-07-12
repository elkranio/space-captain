// src\engine\encounter\encounter_event.ts

import type { EncounterState } from './encounter_state';

export const ENCOUNTER_EVENT = {
    ENCOUNTER_LOADED: 'encounter_loaded',
} as const;

export type EncounterLoadedEvent = {
    type: typeof ENCOUNTER_EVENT.ENCOUNTER_LOADED;
    state: EncounterState;
};

export type EncounterEvent = EncounterLoadedEvent;
