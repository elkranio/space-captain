// src\engine\defs\space_background.ts

export const SPACE_BACKGROUND_ID = {
    NEBULA_00: 'nebula_00',
} as const;

export type SpaceBackgroundId = (typeof SPACE_BACKGROUND_ID)[keyof typeof SPACE_BACKGROUND_ID];
