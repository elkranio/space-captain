// src/engine/encounter/contact/contact_sequence.ts

import type { CharacterPortraitId } from '../../defs/character';

export const CONTACT_SEQUENCE_STEP_KIND = {
    START_CONTACT: 'start_contact',
    MESSAGE: 'message',
    END_CONTACT: 'end_contact',
} as const;

type StartContactSequenceStep = {
    kind: typeof CONTACT_SEQUENCE_STEP_KIND.START_CONTACT;
    waitAfterMs: number;
    contactName: string;
    contactPortraitId: CharacterPortraitId;
};

type MessageContactSequenceStep = {
    kind: typeof CONTACT_SEQUENCE_STEP_KIND.MESSAGE;
    waitAfterMs: number;
    speakerName: string;
    text: string;
};

type EndContactSequenceStep = {
    kind: typeof CONTACT_SEQUENCE_STEP_KIND.END_CONTACT;
    waitAfterMs: number;
};

export type ContactSequenceStep = StartContactSequenceStep | MessageContactSequenceStep | EndContactSequenceStep; //
