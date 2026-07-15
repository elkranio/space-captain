// src/engine/encounter/contact/contact_sequence.ts

import type { CharacterPortraitId } from '../../defs/character';

export const CONTACT_SEQUENCE_STEP_KIND = {
    START_CONTACT: 'start_contact',
    MESSAGE: 'message',
    END_CONTACT: 'end_contact',
    GRANT_DOCKING_CLEARANCE: 'grant_docking_clearance',
} as const;

export type ContactSequenceStepKind = (typeof CONTACT_SEQUENCE_STEP_KIND)[keyof typeof CONTACT_SEQUENCE_STEP_KIND];

export type StartContactSequenceStep = {
    kind: typeof CONTACT_SEQUENCE_STEP_KIND.START_CONTACT;
    waitAfterMs: number;
    contactName: string;
    contactPortraitId: CharacterPortraitId;
};

export type MessageContactSequenceStep = {
    kind: typeof CONTACT_SEQUENCE_STEP_KIND.MESSAGE;
    waitAfterMs: number;
    speakerName: string;
    text: string;
};

export type EndContactSequenceStep = {
    kind: typeof CONTACT_SEQUENCE_STEP_KIND.END_CONTACT;
    waitAfterMs: number;
};

export type GrantDockingClearanceContactSequenceStep = {
    kind: typeof CONTACT_SEQUENCE_STEP_KIND.GRANT_DOCKING_CLEARANCE;
    waitAfterMs: number;
    targetId: string;
};

export type ContactSequenceStep =
    | StartContactSequenceStep
    | MessageContactSequenceStep
    | EndContactSequenceStep
    | GrantDockingClearanceContactSequenceStep;

export type ActiveContactSequence = {
    steps: ContactSequenceStep[];
    currentStepIndex: number;
    waitRemainingMs: number;
};
