// src/engine/encounter/contact/sequences/create_station_hail_sequence.ts
import type { StationEncounterObjectState } from '../../objects/station/station_encounter_object';
import { CONTACT_SEQUENCE_STEP_KIND, type ContactSequenceStep } from './contact_sequence';

// Создаёт contact sequence для обычного HAIL станции.
// Команда только выбирает sequence, но не знает его внутренние шаги.
export function createStationHailSequence(target: StationEncounterObjectState): ContactSequenceStep[] {
    return [
        {
            kind: CONTACT_SEQUENCE_STEP_KIND.START_CONTACT,
            waitAfterMs: 800,
            contactName: target.station.contact.name,
            contactPortraitId: target.station.contact.portraitId,
        },
        {
            kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
            waitAfterMs: 2500,
            speakerName: target.station.contact.name,
            text: 'Station traffic control. State your business.',
        },
        {
            kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
            waitAfterMs: 2500,
            speakerName: 'COMMS',
            text: "Hey beautiful. How's it going?",
        },
        {
            kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
            waitAfterMs: 2000,
            speakerName: target.station.contact.name,
            text: 'Ugh...',
        },
        {
            kind: CONTACT_SEQUENCE_STEP_KIND.END_CONTACT,
            waitAfterMs: 1000,
        },
    ];
}
