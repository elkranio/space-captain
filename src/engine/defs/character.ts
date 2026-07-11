// src\engine\defs\character.ts

export const CHARACTER_PORTRAIT_ID = {
    COMMS_HUMAN_00_CALM: 'comms_human_00_calm',
    COMMS_HUMAN_01_CALM: 'comms_human_01_calm',
} as const;

export type CharacterPortraitId = (typeof CHARACTER_PORTRAIT_ID)[keyof typeof CHARACTER_PORTRAIT_ID];
