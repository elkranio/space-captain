// src/engine/encounter/actors/encounter_actor.ts

// Эфемерный участник текущего encounter.
//
// Actor существует только внутри runtime encounter
// и не является persistent space anchor.
//
// Конкретные actor kinds добавим вместе
// с первым реальным actor gameplay slice.
export type EncounterActorState = {
    id: string;
    displayName: string;

    // Anchor, возле которого actor сейчас находится.
    anchorId: string;
};
