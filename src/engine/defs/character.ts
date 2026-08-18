// src/engine/defs/character.ts

// Стабильные id портретов персонажей.
// Префикс описывает визуальный архетип портрета, а не обязательную роль персонажа в игре.
export const CHARACTER_PORTRAIT_ID = {
    COMMS_ALIEN_00_CALM: "comms_alien_00_calm",
    COMMS_ALIEN_01_CALM: "comms_alien_01_calm",
    COMMS_HUMAN_00_CALM: "comms_human_00_calm",
    COMMS_HUMAN_01_CALM: "comms_human_01_calm",
} as const;

export type CharacterPortraitId = (typeof CHARACTER_PORTRAIT_ID)[keyof typeof CHARACTER_PORTRAIT_ID];
