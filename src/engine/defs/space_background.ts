// src/engine/defs/space_background.ts

// Стабильные id космических фонов для encounter state.
// App-слой мапит эти id на конкретные background sprites.
export const SPACE_BACKGROUND_ID = {
    NEBULA_00: "nebula_00",
} as const;

export type SpaceBackgroundId = (typeof SPACE_BACKGROUND_ID)[keyof typeof SPACE_BACKGROUND_ID];
